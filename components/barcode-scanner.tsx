"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onResult: (code: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect(source: HTMLVideoElement): Promise<{ rawValue?: string; boundingBox?: DOMRectReadOnly }[]>;
    };
  }
}

export function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("הדפדפן או האתר לא תומכים בגישה למצלמה. נסה בדפדפן מעודכן או אשר גישה למצלמה.");
          return;
        }

        if (typeof window !== "undefined" && !("BarcodeDetector" in window)) {
          try {
            const mod = await import("barcode-detector");
            const Polyfill = (mod as { default?: unknown }).default ?? mod;
            (window as Window & { BarcodeDetector: typeof Polyfill }).BarcodeDetector = Polyfill as Window["BarcodeDetector"];
          } catch {
            setError("סריקת ברקוד אינה זמינה בדפדפן זה. הזן מק\"ט ידנית.");
            return;
          }
        }

        if (!window.BarcodeDetector) {
          setError("סריקת ברקוד אינה זמינה בדפדפן זה. הזן מק\"ט ידנית.");
          return;
        }

        const detector = new window.BarcodeDetector({
          formats: ["code_128", "ean_13", "qr_code", "code_39", "upc_a", "upc_e"],
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (!videoRef.current || cancelled) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        async function tick() {
          if (cancelled || !videoRef.current || !detector) return;
          try {
            const detections = await detector.detect(videoRef.current);
            const first = detections[0];
            if (first) {
              const rect = first.boundingBox;
              if (rect) {
                setBox({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
              }
              const code = first.rawValue;
              if (code) {
                onResult(code);
                onClose();
                return;
              }
            } else {
              setBox(null);
            }
          } catch {
          }
          requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          setError("נדרשת הרשאת גישה למצלמה. אשר בהגדרות הדפדפן או המכשיר.");
        } else if (msg.includes("NotFound")) {
          setError("לא נמצאה מצלמה.");
        } else {
          setError("לא ניתן להפעיל מצלמה. ודא שהאתר פועל ב-HTTPS ושאין חסימה.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onClose, onResult]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[1200] flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-sm text-muted-foreground">כוון את המצלמה אל הברקוד של המקט</div>
      <div className="w-full max-w-sm aspect-video rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-black relative">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        {box && (
          <div
            className="absolute border-2 border-emerald-400 rounded-md"
            style={{
              left: `${box.x}px`,
              top: `${box.y}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
            }}
          />
        )}
      </div>
      {error && <div className="text-xs text-red-400 text-center max-w-sm">{error}</div>}
      <Button variant="outline" onClick={onClose} className="border-[var(--glass-border)]">
        ביטול
      </Button>
    </div>
  );
}
