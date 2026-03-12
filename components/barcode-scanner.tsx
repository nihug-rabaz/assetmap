"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onResult: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
   const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        if (!("BarcodeDetector" in window)) {
          setError("הדפדפן לא תומך בסריקת ברקוד");
          return;
        }

        const BarcodeDetectorCtor = (window as any).BarcodeDetector as typeof BarcodeDetector;
        const detector = new BarcodeDetectorCtor({
          formats: ["code_128", "ean_13", "qr_code", "code_39", "upc_a", "upc_e"],
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (!videoRef.current || cancelled) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        async function tick() {
          if (cancelled || !videoRef.current) return;
          try {
            const detections = await detector.detect(videoRef.current);
            const first = detections[0];
            if (first) {
              const rect = first.boundingBox;
              if (rect) {
                setBox({
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                });
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
      } catch {
        setError("לא ניתן להפעיל מצלמה");
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
        <video ref={videoRef} className="w-full h-full object-cover" />
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
      {error && <div className="text-xs text-red-400">{error}</div>}
      <Button variant="outline" onClick={onClose} className="border-[var(--glass-border)]">
        ביטול
      </Button>
    </div>
  );
}

