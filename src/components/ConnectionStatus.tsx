import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export const ConnectionStatus = ({ isConnected }: ConnectionStatusProps) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-accent" />
          <span className="text-accent">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Disconnected</span>
        </>
      )}
    </div>
  );
};
