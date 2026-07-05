import React, { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if prompt should be shown today
    const lastDismissed = localStorage.getItem('installPromptDismissedAt');
    const today = new Date().toDateString();
    
    if (lastDismissed === today) {
      return; // Already dismissed today
    }

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      return; // App is already installed
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIOSDevice) {
      setIsIOS(true);
      // Delay showing the prompt to be less intrusive
      setTimeout(() => setShowPrompt(true), 3000);
      // We don't return here because we also want to listen to beforeinstallprompt just in case
    }

    // Handle Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Delay showing the prompt
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: If not iOS and no beforeinstallprompt after 5s, we can still show a generic prompt on Android/Chrome
    // Wait, let's just rely on beforeinstallprompt for Android, but on some browsers it might not fire if criteria aren't met.
    // If we want to force it, we can just show it anyway.
    const fallbackTimer = setTimeout(() => {
        if (!isIOSDevice && !deferredPrompt) {
             // In modern PWA logic, if beforeinstallprompt didn't fire, we can't trigger native install anyway.
             // But we can show instructions to use browser menu.
             setShowPrompt(true);
        }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt]);

  const dismissPrompt = () => {
    localStorage.setItem('installPromptDismissedAt', new Date().toDateString());
    setShowPrompt(false);
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, just dismiss for now since instructions are already shown
      dismissPrompt();
      return;
    }

    if (!deferredPrompt) {
        // If no deferred prompt, user has to install manually via browser menu
        alert("To install the app, tap the browser menu (⋮) and select 'Install app' or 'Add to Home screen'.");
        dismissPrompt();
        return;
    }

    // Show the native install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt. Clear it up.
    setDeferredPrompt(null);
    setShowPrompt(false);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      // If they explicitly cancel native prompt, hide it for today
      localStorage.setItem('installPromptDismissedAt', new Date().toDateString());
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#1a1c23]/95 backdrop-blur-xl border border-gray-800/80 p-4 rounded-2xl shadow-2xl z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20 flex-shrink-0">
            <Download className="text-cyan-400" size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Install ProcFin App</h3>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
              Add to your home screen for quick access.
            </p>
          </div>
        </div>
        <button 
          onClick={dismissPrompt}
          className="text-gray-500 hover:text-gray-300 p-1 transition-colors ml-2"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      {isIOS ? (
        <div className="mt-4 bg-gray-900/50 rounded-lg p-3 border border-gray-800/50">
          <p className="text-xs text-gray-300 flex flex-col gap-2">
            <span className="flex items-center gap-2">
              1. Tap the <Share size={14} className="text-cyan-400 inline" /> Share button below
            </span>
            <span className="flex items-center gap-2">
              2. Scroll and tap <PlusSquare size={14} className="text-cyan-400 inline" /> "Add to Home Screen"
            </span>
          </p>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2">
          <button 
            onClick={dismissPrompt}
            className="flex-1 py-2 px-3 text-xs font-bold text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700/50"
          >
            Don't show today
          </button>
          <button 
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3 text-xs font-bold text-black bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            Install App
          </button>
        </div>
      )}
    </div>
  );
}
