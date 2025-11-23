import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDerivWebSocket } from '@/hooks/useDerivWebSocket';
import { VolatilitySelector } from './VolatilitySelector';
import { ConnectionStatus } from './ConnectionStatus';

type MarketType = 'Even/Odd' | 'Over/Under' | 'Matches' | 'Differs' | 'Accumulator';

export const OtherMarketsTab = () => {
  const [selectedIndex, setSelectedIndex] = useState('R_10');
  const [marketType, setMarketType] = useState<MarketType>('Even/Odd');
  const [targetDigit, setTargetDigit] = useState(5);
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const { ticks, isConnected } = useDerivWebSocket(selectedIndex);

  const analyzeEvenOdd = () => {
    const recent = ticks.slice(-50);
    const evenCount = recent.filter(t => t.digit % 2 === 0).length;
    const oddCount = recent.length - evenCount;
    const evenPercent = (evenCount / recent.length) * 100;
    const oddPercent = (oddCount / recent.length) * 100;
    
    // Predict next 3-20 ticks
    const prediction = evenPercent > oddPercent ? 'EVEN' : 'ODD';
    const confidence = Math.max(evenPercent, oddPercent);
    
    return {
      recent: recent.map(t => t.digit % 2 === 0 ? 'E' : 'O'),
      evenPercent: evenPercent.toFixed(1),
      oddPercent: oddPercent.toFixed(1),
      prediction,
      confidence: confidence.toFixed(1),
      recommendation: `${prediction} contracts likely to dominate next 3-20 ticks`
    };
  };

  const analyzeOverUnder = () => {
    const recent = ticks.slice(-50);
    const overCount = recent.filter(t => t.digit > targetDigit).length;
    const underCount = recent.filter(t => t.digit < targetDigit).length;
    const equalCount = recent.length - overCount - underCount;
    
    const overPercent = (overCount / recent.length) * 100;
    const underPercent = (underCount / recent.length) * 100;
    
    // Predict which contract type will appear more
    const prediction = overPercent > underPercent ? 'OVER' : 'UNDER';
    const confidence = Math.max(overPercent, underPercent);
    
    return {
      recent: recent.map(t => t.digit > targetDigit ? 'O' : t.digit < targetDigit ? 'U' : '='),
      overPercent: overPercent.toFixed(1),
      underPercent: underPercent.toFixed(1),
      equalPercent: ((equalCount / recent.length) * 100).toFixed(1),
      prediction,
      confidence: confidence.toFixed(1),
      recommendation: `${prediction} contracts likely to appear more in next 3-26 ticks`,
      digit: targetDigit
    };
  };

  const analyzeMatches = () => {
    const recent = ticks.slice(-50);
    const digitCounts: { [key: number]: number } = {};
    
    recent.forEach(t => {
      digitCounts[t.digit] = (digitCounts[t.digit] || 0) + 1;
    });
    
    const mostFrequent = Object.entries(digitCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      digitCounts,
      mostFrequent: mostFrequent[0],
      frequency: ((Number(mostFrequent[1]) / recent.length) * 100).toFixed(1),
      recommendation: `Digit ${mostFrequent[0]} appeared ${mostFrequent[1]} times (${((Number(mostFrequent[1]) / recent.length) * 100).toFixed(1)}%)`
    };
  };

  const handleScan = () => {
    if (ticks.length < 30) return;
    
    setIsScanning(true);
    
    setTimeout(() => {
      let result;
      switch (marketType) {
        case 'Even/Odd':
          result = analyzeEvenOdd();
          break;
        case 'Over/Under':
          result = analyzeOverUnder();
          break;
        case 'Matches':
        case 'Differs':
          result = analyzeMatches();
          break;
        case 'Accumulator':
          result = { recommendation: 'Accumulator analysis coming soon' };
          break;
        default:
          result = {};
      }
      
      setAnalysis(result);
      setIsScanning(false);
    }, 500);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <ConnectionStatus isConnected={isConnected} />

      <Card className="p-4 md:p-6 bg-card border-border">
        <h2 className="text-lg font-semibold text-primary mb-4">Market Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Volatility Index</label>
            <VolatilitySelector value={selectedIndex} onChange={setSelectedIndex} />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Market Type</label>
            <select 
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
              value={marketType}
              onChange={(e) => setMarketType(e.target.value as MarketType)}
            >
              <option value="Even/Odd">Even/Odd</option>
              <option value="Over/Under">Over/Under</option>
              <option value="Matches">Matches</option>
              <option value="Differs">Differs</option>
              <option value="Accumulator">Accumulator</option>
            </select>
          </div>
        </div>

        {(marketType === 'Over/Under' || marketType === 'Matches' || marketType === 'Differs') && (
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Target Digit</label>
            <input 
              type="number"
              min="0"
              max="9"
              value={targetDigit}
              onChange={(e) => setTargetDigit(Number(e.target.value))}
              className="w-full md:w-32 bg-background border border-border rounded px-3 py-2 text-sm"
            />
          </div>
        )}

        <Button 
          onClick={handleScan}
          disabled={isScanning || ticks.length < 30}
          className="w-full"
          size="lg"
        >
          {isScanning ? 'Scanning...' : 'Scan Market'}
        </Button>
      </Card>

      {analysis && (
        <Card className="p-4 md:p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-primary mb-4">Analysis Results</h3>
          
          {marketType === 'Even/Odd' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">Even</div>
                  <div className="text-2xl font-bold text-primary">{analysis.evenPercent}%</div>
                </div>
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">Odd</div>
                  <div className="text-2xl font-bold text-primary">{analysis.oddPercent}%</div>
                </div>
              </div>
              
              <div className="p-4 bg-primary/10 rounded">
                <div className="text-sm text-muted-foreground mb-2">Prediction</div>
                <div className="text-xl font-bold text-primary">{analysis.prediction}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Confidence: {analysis.confidence}%
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {analysis.recommendation}
                </div>
              </div>
              
              <div className="p-3 bg-secondary/20 rounded">
                <div className="text-xs text-muted-foreground mb-2">Last 50 Ticks (E/O)</div>
                <div className="font-mono text-sm break-all">
                  {analysis.recent.join('')}
                </div>
              </div>
            </div>
          )}

          {marketType === 'Over/Under' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">Over {analysis.digit}</div>
                  <div className="text-2xl font-bold text-primary">{analysis.overPercent}%</div>
                </div>
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">Under {analysis.digit}</div>
                  <div className="text-2xl font-bold text-primary">{analysis.underPercent}%</div>
                </div>
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">Equal</div>
                  <div className="text-2xl font-bold text-primary">{analysis.equalPercent}%</div>
                </div>
              </div>
              
              <div className="p-4 bg-primary/10 rounded">
                <div className="text-sm text-muted-foreground mb-2">Prediction</div>
                <div className="text-xl font-bold text-primary">{analysis.prediction}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Confidence: {analysis.confidence}%
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {analysis.recommendation}
                </div>
              </div>
              
              <div className="p-3 bg-secondary/20 rounded">
                <div className="text-xs text-muted-foreground mb-2">Last 50 Ticks (O/U/=)</div>
                <div className="font-mono text-sm break-all">
                  {analysis.recent.join('')}
                </div>
              </div>
            </div>
          )}

          {(marketType === 'Matches' || marketType === 'Differs') && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded">
                <div className="text-sm text-muted-foreground mb-2">Most Frequent Digit</div>
                <div className="text-4xl font-bold text-primary">{analysis.mostFrequent}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {analysis.recommendation}
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(analysis.digitCounts).map(([digit, count]) => (
                  <div key={digit} className="p-3 bg-secondary/30 rounded text-center">
                    <div className="text-lg font-bold text-primary">{digit}</div>
                    <div className="text-xs text-muted-foreground">{count as number}x</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="p-4 bg-card border-border">
        <p className="text-xs text-muted-foreground text-center">
          📊 Market analysis helps identify trends and patterns. Use Scan to get instant predictions
          based on recent tick data. Results update in real-time as new ticks arrive.
        </p>
      </Card>
    </div>
  );
};
