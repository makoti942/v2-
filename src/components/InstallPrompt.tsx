import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const InstallPrompt = () => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();

  if (!canInstall || isInstalled) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <Card className="mx-auto max-w-md bg-card border-border shadow-xl">
        <div className="flex items-center justify-between p-4 gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/candle-icon-512.png"
              alt="Makoti Predictor app icon"
              className="h-8 w-8 rounded"
              loading="lazy"
            />
            <div>
              <p className="text-sm font-semibold">Install Makoti Predictor</p>
              <p className="text-xs text-muted-foreground">Add to your home screen for a full app experience</p>
            </div>
          </div>
          <Button size="sm" onClick={promptInstall}>
            <Download className="h-4 w-4 mr-2" /> Install
          </Button>
        </div>
      </Card>
    </div>
  );
};