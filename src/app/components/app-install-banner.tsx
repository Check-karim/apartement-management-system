"use client";

import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";

export function AppInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if this is a desktop browser
    const isDesktop = window.innerWidth >= 768;
    const hasBeenDismissed = localStorage.getItem('installBannerDismissed');
    
    if (isDesktop && !hasBeenDismissed) {
      setShowBanner(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (isDesktop && !hasBeenDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('installBannerDismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <Smartphone className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Get the mobile app</p>
            <p className="text-xs text-blue-100">
              Install the app for a better mobile experience
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-50 transition-colors"
            >
              Install
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-blue-600 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 