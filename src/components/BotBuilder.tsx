import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useBotTrading, BotConfig } from '@/hooks/useBotTrading';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Play, 
  Square, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Zap,
  RefreshCw,
  RotateCcw,
  Trash2
} from 'lucide-react';

const BotBuilder = () => {
  const { user, resetBalance } = useAuth();
  const [showResults, setShowResults] = useState(false);
  const [journalLogs, setJournalLogs] = useState<string[]>([]);
  
  // Bot configuration state
  const [market, setMarket] = useState('R_10');
  const [contractType, setContractType] = useState('Digit Matches');
  const [stake, setStake] = useState(0.35);
  const [duration, setDuration] = useState(1);
  const [targetDigit, setTargetDigit] = useState(5);
  const [takeProfit, setTakeProfit] = useState(2);
  const [stopLoss, setStopLoss] = useState(3);
  const [tradeOnEveryTick, setTradeOnEveryTick] = useState(false);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState(2);
  const [maxStake, setMaxStake] = useState(100);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setJournalLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const { isRunning, trades, start, stop, resetTrades } = useBotTrading(addLog);

  const handleRun = () => {
    if (!isRunning) {
      setShowResults(true);
      setJournalLogs([]);
      addLog('🚀 Bot starting...');
      
      const config: BotConfig = {
        market,
        contractType,
        stake,
        duration,
        digit: ['Digit Matches', 'Digit Differs', 'Digit Over', 'Digit Under'].includes(contractType) ? targetDigit : undefined,
        takeProfit,
        stopLoss,
        tradeOnEveryTick,
        martingaleMultiplier,
        maxStake
      };
      
      start(config);
    } else {
      stop();
    }
  };

  const handleResetBalance = async () => {
    if (!user || user.activeAccount.type !== 'demo') {
      addLog('⚠️ Balance reset only available for demo accounts');
      return;
    }
    
    addLog('🔄 Resetting balance...');
    await resetBalance();
    addLog('✅ Balance reset to demo account default');
  };

  const handleResetTrades = () => {
    resetTrades();
    setJournalLogs(['🗑️ Trade history cleared']);
  };

  const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const winRate = trades.length > 0 ? ((trades.filter(t => t.status === 'won').length / trades.length) * 100) : 0;

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-12rem)] gap-4 relative">
      
      {/* Center - Workspace */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Toolbar */}
        <Card className="p-3 bg-card border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRun}
              variant={isRunning ? 'destructive' : 'default'}
              size="sm"
            >
              {isRunning ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </>
              )}
            </Button>
            {user?.activeAccount.type === 'demo' && (
              <Button
                onClick={handleResetBalance}
                variant="outline"
                size="sm"
                disabled={isRunning}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Balance
              </Button>
            )}
            <Button
              onClick={handleResetTrades}
              variant="outline"
              size="sm"
              disabled={isRunning}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Configure your strategy and press 'Run'
          </div>
        </Card>

        {/* Workspace */}
        <Card className="flex-1 bg-card border-border overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              <div className="border-2 border-primary/30 rounded p-4 bg-primary/5 space-y-4">
                
                {/* Block 1: Trade Parameters */}
                <div className="bg-card/50 p-4 rounded border border-primary/20">
                  <h4 className="font-semibold text-primary mb-3 text-sm flex items-center gap-2"><Settings className="w-4 h-4"/>1. Trade Parameters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block mb-1 text-muted-foreground">Market</label>
                      <select 
                        className="w-full bg-background border border-border rounded px-2 py-1.5"
                        value={market}
                        onChange={(e) => setMarket(e.target.value)}
                        disabled={isRunning}
                      >
                        <option value="R_10">Volatility 10 Index</option>
                        <option value="R_25">Volatility 25 Index</option>
                        <option value="R_50">Volatility 50 Index</option>
                        <option value="R_75">Volatility 75 Index</option>
                        <option value="R_100">Volatility 100 Index</option>
                        <option value="1HZ10V">Volatility 10 (1s) Index</option>
                        <option value="1HZ25V">Volatility 25 (1s) Index</option>
                        <option value="1HZ50V">Volatility 50 (1s) Index</option>
                        <option value="1HZ75V">Volatility 75 (1s) Index</option>
                        <option value="1HZ100V">Volatility 100 (1s) Index</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-muted-foreground">Contract Type</label>
                      <select 
                        className="w-full bg-background border border-border rounded px-2 py-1.5"
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                        disabled={isRunning}
                      >
                        <option>Digit Matches</option>
                        <option>Digit Differs</option>
                        <option>Digit Even</option>
                        <option>Digit Odd</option>
                        <option>Digit Over</option>
                        <option>Digit Under</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-muted-foreground">Stake ($)</label>
                      <input 
                        type="number" 
                        className="w-full bg-background border border-border rounded px-2 py-1.5" 
                        value={stake} 
                        onChange={(e) => setStake(Number(e.target.value))}
                        step="0.01"
                        min="0.35"
                        disabled={isRunning}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-muted-foreground">Duration (Ticks)</label>
                      <input 
                        type="number" 
                        className="w-full bg-background border border-border rounded px-2 py-1.5" 
                        value={duration} 
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min="1"
                        disabled={isRunning}
                      />
                    </div>
                  </div>
                </div>

                {/* Block 2: Purchase Condition */}
                <div className="bg-card/50 p-4 rounded border border-primary/20">
                  <h4 className="font-semibold text-primary mb-3 text-sm flex items-center gap-2"><Zap className="w-4 h-4"/>2. Purchase Condition</h4>
                  <div className="space-y-3 text-xs">
                    {['Digit Matches', 'Digit Differs', 'Digit Over', 'Digit Under'].includes(contractType) && (
                        <div>
                          <label className="block mb-1 text-muted-foreground">Target Digit</label>
                          <input 
                            type="number" 
                            className="w-full bg-background border border-border rounded px-2 py-1.5 max-w-xs" 
                            value={targetDigit} 
                            onChange={(e) => setTargetDigit(Number(e.target.value))}
                            min="0" 
                            max="9" 
                            disabled={isRunning}
                          />
                        </div>
                      )}
                       <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="trade-every-tick"
                          checked={tradeOnEveryTick}
                          onCheckedChange={setTradeOnEveryTick}
                          disabled={isRunning}
                        />
                        <Label htmlFor="trade-every-tick" className="text-muted-foreground cursor-pointer">
                          Trade on Every Tick
                        </Label>
                      </div>
                  </div>
                </div>

                 {/* Block 3: Restart Trade Condition */}
                <div className="bg-card/50 p-4 rounded border border-primary/20">
                   <h4 className="font-semibold text-primary mb-3 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4"/>3. Trade Again After a Trade Finishes</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block mb-1 text-muted-foreground">Take Profit ($)</label>
                        <input 
                          type="number" 
                          className="w-full bg-background border border-border rounded px-2 py-1.5" 
                          value={takeProfit} 
                          onChange={(e) => setTakeProfit(Number(e.target.value))}
                          step="0.01"
                          min="0"
                          disabled={isRunning}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-muted-foreground">Stop Loss ($)</label>
                        <input 
                          type="number" 
                          className="w-full bg-background border border-border rounded px-2 py-1.5" 
                          value={stopLoss} 
                          onChange={(e) => setStopLoss(Number(e.target.value))}
                          step="0.01"
                          min="0"
                          disabled={isRunning}
                        />
                      </div>
                   </div>
                   <div className="mt-4 pt-4 border-t border-border/50">
                      <h5 className="font-semibold text-primary/80 mb-2 text-xs">Martingale Strategy</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block mb-1 text-muted-foreground">Martingale Multiplier</label>
                          <input 
                            type="number" 
                            className="w-full bg-background border border-border rounded px-2 py-1.5" 
                            value={martingaleMultiplier}
                            onChange={(e) => setMartingaleMultiplier(Number(e.target.value))}
                            step="0.1" 
                            min="1"
                            disabled={isRunning}
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-muted-foreground">Max Stake ($)</label>
                          <input 
                            type="number" 
                            className="w-full bg-background border border-border rounded px-2 py-1.5" 
                            value={maxStake}
                            onChange={(e) => setMaxStake(Number(e.target.value))}
                            step="1" 
                            min="1"
                            disabled={isRunning}
                          />
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Right Panel - Results (Collapsible) */}
      {showResults && (
        <Card className="w-full md:w-96 flex-shrink-0 bg-card border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-primary">Results</h3>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowResults(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Tabs defaultValue="journal" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2 shrink-0">
              <TabsTrigger value="journal" className="text-xs">Journal</TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs">Trades</TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="journal" className="flex-1 m-4 mt-2 overflow-hidden">
              <ScrollArea className="h-full max-h-[calc(100vh-22rem)] md:max-h-full bg-muted/30 rounded p-3">
                <div className="space-y-2 text-xs font-mono">
                  {journalLogs.map((log, idx) => (
                    <div key={idx} className={
                      log.includes('WON') ? 'text-green-400' :
                      log.includes('LOST') ? 'text-red-400' :
                      log.includes('reset') ? 'text-yellow-400' :
                      log.includes('Error') || log.includes('stopped') ? 'text-red-400' :
                      'text-primary/70'
                    }>
                      {log}
                    </div>
                  ))}
                </div>
                {journalLogs.length === 0 && (
                   <div className="text-xs text-muted-foreground text-center pt-4">
                    Journal logs will appear here when the bot is running.
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="transactions" className="flex-1 m-4 mt-2 overflow-hidden">
               <ScrollArea className="h-full max-h-[calc(100vh-22rem)] md:max-h-full bg-muted/30 rounded p-3">
                {trades.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {[...trades].reverse().map((trade, idx) => (
                      <div key={idx} className={`p-2 rounded border ${
                        trade.status === 'won' ? 'bg-green-500/10 border-green-500/30' :
                        trade.status === 'lost' ? 'bg-red-500/10 border-red-500/30' :
                        'bg-blue-500/10 border-blue-500/30'
                      }`}>
                        <div className="font-mono text-xs text-muted-foreground">ID: {trade.contractId}</div>
                        <div className="flex justify-between items-center mt-1 font-medium">
                          <span>Buy: {trade.buyPrice.toFixed(2)}</span>
                          {trade.sellPrice && <span>Sell: {trade.sellPrice.toFixed(2)}</span>}
                           {trade.profit !== undefined && (
                            <div className={`font-bold ${trade.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.profit > 0 ? '+' : ''}{trade.profit.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center pt-4">
                    Transactions will appear here.
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="summary" className="flex-1 m-4 mt-2">
              <div className="space-y-3 text-sm">
                <div className="bg-muted/30 rounded p-3 flex justify-between items-center">
                  <div className="text-muted-foreground">Total Profit/Loss</div>
                  <div className={`font-bold ${totalProfit > 0 ? 'text-green-400' : totalProfit < 0 ? 'text-red-400' : 'text-primary'}`}>
                    {totalProfit.toFixed(2)} USD
                  </div>
                </div>
                <div className="bg-muted/30 rounded p-3 flex justify-between items-center">
                  <div className="text-muted-foreground">Total Trades</div>
                  <div className="font-bold text-primary">{trades.length}</div>
                </div>
                <div className="bg-muted/30 rounded p-3 flex justify-between items-center">
                   <div className="text-muted-foreground">Win Rate</div>
                  <div className="font-bold text-primary">{winRate.toFixed(1)}%</div>
                </div>
                 <div className="bg-muted/30 rounded p-3 flex justify-between items-center">
                   <div className="text-muted-foreground">Trades Won</div>
                  <div className="font-bold text-green-400">{trades.filter(t => t.status === 'won').length}</div>
                </div>
                 <div className="bg-muted/30 rounded p-3 flex justify-between items-center">
                   <div className="text-muted-foreground">Trades Lost</div>
                  <div className="font-bold text-red-400">{trades.filter(t => t.status === 'lost').length}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Show Results Button (when collapsed on mobile) */}
      {!showResults && (
        <div className="md:hidden fixed bottom-4 right-4">
          <Button
            variant="default"
            className="shadow-lg"
            onClick={() => setShowResults(true)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            View Results
          </Button>
        </div>
      )}
    </div>
  );
};

export default BotBuilder;
