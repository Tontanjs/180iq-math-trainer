'use client';
import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true); // default hidden until checked

  useEffect(() => {
    const wasDismissed = localStorage.getItem('180iq_install_dismissed') === '1';
    if (!wasDismissed) setDismissed(false);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
  }

  function dismiss() {
    setDismissed(true);
    localStorage.setItem('180iq_install_dismissed', '1');
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-700 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#0F75BC] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
          <Smartphone className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-white text-sm">Add to Home Screen</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Install 180IQ for offline access</p>
        </div>
        <button
          onClick={dismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={install}
        className="mt-3 w-full h-9 bg-[#0F75BC] hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Download className="h-4 w-4" />
        Install App
      </button>
    </div>
  );
}
