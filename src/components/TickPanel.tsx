import { Tick } from '@/hooks/useDerivWebSocket';
import { Card } from '@/components/ui/card';

interface TickPanelProps {
  ticks: Tick[];
}

export const TickPanel = ({ ticks }: TickPanelProps) => {
  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-semibold text-primary mb-4 glow">Last 50 Ticks</h2>
      <div className="h-[400px] overflow-y-auto bg-muted/30 rounded p-4 space-y-1">
        {ticks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Waiting for tick data...
          </div>
        ) : (
          <div className="grid grid-cols-10 gap-2">
            {ticks.map((tick, index) => (
              <div
                key={index}
                className="flex items-center justify-center w-10 h-10 rounded bg-secondary/50 border border-primary/20 mono text-sm font-bold text-primary hover:border-primary transition-all hover:scale-110"
              >
                {tick.digit}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-muted-foreground text-right mono">
        {ticks.length} / 50 ticks received
      </div>
    </Card>
  );
};
