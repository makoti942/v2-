import { useState, useEffect } from 'react';
import { useDerivWebSocket } from '@/hooks/useDerivWebSocket';
import { runConsensus } from '@/utils/strategies';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConnectionStatus } from './ConnectionStatus';
import { VolatilitySelector } from './VolatilitySelector';
import { TickPanel } from './TickPanel';

export const MakotiPredictor = () => {
  const [selectedIndex, setSelectedIndex] = useState('R_10');
  const [predictedDigit, setPredictedDigit] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Running background strategies… calculating high-probability digit…');

  const { ticks, isConnected } = useDerivWebSocket(selectedIndex);

  // Background strategies run silently; prediction only changes on Scan
  useEffect(() => {
    if (ticks.length < 30) {
      setStatus('Gathering data… need at least 30 ticks');
    }
  }, [ticks.length]);

  const handleScan = async () => {
    if (ticks.length < 30) {
      setStatus('Need at least 30 ticks for analysis');
      return;
    }

    setIsScanning(true);
    setStatus('Scanning all strategies and indicators...');

    // Use last 50 ticks and exclude the most recent tick to avoid echo bias
    const recent = ticks.slice(-50);
    const analysisTicks = recent.length > 1 ? recent.slice(0, -1) : recent;
    const result = runConsensus(analysisTicks);
    setPredictedDigit(result.digit);
    setConfidence(result.confidence);
    setStatus('Scan complete - Prediction locked');
    setIsScanning(false);
  };

  return (
    <div className="space-y-6 p-6">
      <ConnectionStatus isConnected={isConnected} />

      <Card className="p-6 bg-card border-border">
        <VolatilitySelector value={selectedIndex} onChange={setSelectedIndex} />
      </Card>

      {/* Predicted Digit Panel */}
      <Card className="p-8 bg-card border-border">
        <h2 className="text-lg font-semibold text-primary mb-4 text-center">Predicted Digit (Matches)</h2>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isScanning ? (
            <div className="text-6xl font-bold text-primary animate-pulse mono">
              ...
            </div>
          ) : predictedDigit !== null ? (
            <>
              <div className="text-8xl font-bold text-primary glow mono animate-pulse-glow">
                {predictedDigit}
              </div>
              <div className="text-sm text-muted-foreground">
                Confidence: {(confidence * 100).toFixed(1)}%
              </div>
              {confidence < 0.5 && (
                <div className="text-xs text-yellow-500">
                  ⚠ Low confidence - Consider waiting for more data
                </div>
              )}
            </>
          ) : (
            <div className="text-2xl text-muted-foreground">
              Press Scan to analyze
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={handleScan}
            disabled={isScanning || ticks.length < 30}
            size="lg"
            className="w-full max-w-md"
          >
            {isScanning ? 'Scanning...' : 'Scan Market'}
          </Button>
        </div>

        <div className="mt-4 text-sm text-center text-muted-foreground">
          {status}
        </div>
      </Card>

      {/* Last 50 Ticks */}
      <TickPanel ticks={ticks} />

      {/* Info Panel */}
      <Card className="p-4 bg-card border-border">
        <p className="text-xs text-muted-foreground text-center">
          🔍 Advanced Analysis Engine: 12 strategies including Digit Repetition, Sum Patterns, Clusters, 
          Volatility (BB + ATR), RSI, MACD, EMA/SMA, Stochastic, Momentum, Tick Field Analysis, 
          Candlestick Patterns (Hammer, Doji, Engulfing), and Body-to-Wick Ratio. 
          Prediction shows the digit most likely to appear in next 3-6 ticks with high probability.
        </p>
      </Card>
    </div>
  );
};

export default MakotiPredictor;
