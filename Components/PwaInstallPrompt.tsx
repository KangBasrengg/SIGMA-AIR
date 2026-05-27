"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-4 rounded-xl border border-sea-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sea-100 text-sea-600 dark:bg-sea-500/20 dark:text-sea-400">
          <Download size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-ink dark:text-white">Pasang Aplikasi</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Akses lebih cepat & mode offline</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="rounded-lg bg-sea-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sea-700 dark:bg-sea-500 dark:hover:bg-sea-600"
        >
          Install
        </button>
        <button
          onClick={handleClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
