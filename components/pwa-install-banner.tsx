"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const installedFlag = window.localStorage.getItem("assetmap_pwa_installed");
    if (installedFlag === "true") {
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    const appInstalledHandler = () => {
      window.localStorage.setItem("assetmap_pwa_installed", "true");
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", appInstalledHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-16 inset-x-0 z-[1200] flex justify-center px-4">
      <div className="bg-card/95 border border-[var(--glass-border)] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 max-w-md w-full">
        <div className="flex-1 text-xs text-muted-foreground text-right">
          אפשר להתקין את AssetMap כאפליקציה במסך הבית שלך.
        </div>
        <Button
          size="sm"
          className="text-xs bg-[var(--primary)] text-black font-extrabold hover:bg-[var(--primary)]/90"
          onClick={async () => {
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === "accepted") {
              setVisible(false);
              setDeferredPrompt(null);
              if (typeof window !== "undefined") {
                window.localStorage.setItem("assetmap_pwa_installed", "true");
              }
            }
          }}
        >
          התקן אפליקציה
        </Button>
        <button
          className="text-xs text-muted-foreground hover:text-foreground px-1"
          onClick={() => setVisible(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

