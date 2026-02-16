import { useEffect, useState } from "react";
import { Download, Share, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import fitstarLogo from "@/assets/fitstar-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <img src={fitstarLogo} alt="FitStar" className="mb-6 h-28 w-28 rounded-3xl shadow-xl" />
      <h1 className="font-display text-3xl font-bold text-foreground">Install FitStar</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Add FitStar to your home screen for a native app experience — works offline, loads instantly.
      </p>

      {installed ? (
        <div className="mt-8 flex items-center gap-2 text-primary">
          <CheckCircle className="h-6 w-6" />
          <span className="text-lg font-semibold">App installed!</span>
        </div>
      ) : deferredPrompt ? (
        <Button onClick={handleInstall} size="lg" className="mt-8 gap-2">
          <Download className="h-5 w-5" /> Install App
        </Button>
      ) : isIOS ? (
        <div className="mt-8 space-y-3 rounded-xl border border-border bg-secondary/50 p-5 text-left text-sm">
          <p className="font-semibold text-foreground">To install on iPhone/iPad:</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Share className="h-4 w-4 shrink-0" /> Tap the <strong>Share</strong> button
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plus className="h-4 w-4 shrink-0" /> Tap <strong>Add to Home Screen</strong>
          </div>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Open this page in your mobile browser to install the app.
        </p>
      )}
    </div>
  );
};

export default Install;
