import { useEffect, useRef, useState, useCallback } from 'react';

export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall as any);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as any);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return { outcome: 'dismissed' } as const;

    promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    }
    return choiceResult;
  }, []);

  return { canInstall, isInstalled, promptInstall };
};