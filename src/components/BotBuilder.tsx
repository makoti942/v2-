import { useState, useRef } from 'react';
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
  Calculator,
  Type,
  List,
  RefreshCw,
  Box,
  RotateCcw,
  Trash2
} from 'lucide-react';

interface BlockCategory {
  name: string;
  icon: any;
  blocks: string[];
}

const BotBuilder = () => {
  const { user, resetBalance } = useAuth();
  const [showResults, setShowResults] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(true);
  const [journalLogs, setJournalLogs] = useState<string[]>([]);
  
  // Bot configuration state
  const [market, setMarket] = useState('R_10');
  const [contractType, setContractType] = useState('Matches/Differs');
  const [stake, setStake] = useState(0.35);
  const [duration, setDuration] = useState(1);
  const [targetDigit, setTargetDigit] = useState(5);
  const [takeProfit, setTakeProfit] = useState(2);
  const [stopLoss, setStopLoss] = useState(3);
  const [tradeOnEveryTick, setTradeOnEveryTick] = useState(false);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState(2);
  const [maxStake, setMaxStake] = useState(100);

  const addLog = (message: string) => {
    setJournalLogs(prev => [...prev, message]);
  };

  const { isRunning, trades, start, stop, resetTrades } = useBotTrading(addLog);

  const blockCategories: BlockCategory[] = [
    {
      name: 'Trade Parameters',
      icon: Settings,
      blocks: ['Market', 'Contract Type', 'Stake', 'Duration', 'Payout', 'Barrier', 'Account Type', 'Candle Interval']
    },
    {
      name: 'Purchase Condition',
      icon: Zap,
      blocks: ['Matches', 'Differs', 'Even', 'Odd', 'Over', 'Under']
    },
    {
      name: 'Sell Condition',
      icon: Calculator,
      blocks: ['Profit Target', 'Stop Loss', 'Time-based Exit', 'Custom Condition']
    },
    {
      name: 'Restart Trade',
      icon: RefreshCw,
      blocks: ['Martingale', 'Stake Multiplier', 'Max Trades', 'Reset After', 'Timer']
    },
    {
      name: 'Logic',
      icon: Box,
      blocks: ['If', 'Else', 'AND', 'OR', 'NOT', 'Compare', 'Boolean']
    },
    {
      name: 'Math',
      icon: Calculator,
      blocks: ['Add', 'Subtract', 'Multiply', 'Divide', 'Modulo', 'Min', 'Max', 'Random']
    },
    {
      name: 'Variables',
      icon: Type,
      blocks: ['Create Variable', 'Set Variable', 'Get Variable', 'Delete Variable']
    },
    {
      name: 'Indicators',
      icon: Zap,
      blocks: ['RSI', 'MACD', 'EMA', 'SMA', 'WMA', 'Bollinger Bands', 'Stochastic', 'ATR', 'Momentum', 'CCI', 'Williams %R', 'Parabolic SAR']
    },
    {
      name: 'Lists',
      icon: List,
      blocks: ['Create List', 'Add to List', 'Get from List', 'Loop Through List']
    },
    {
      name: 'Text',
      icon: Type,
      blocks: ['Join Text', 'Split Text', 'Substring', 'Text Length']
    }
  ];

  const handleRun = () => {
    if (!isRunning) {
      setShowResults(true);
      setJournalLogs(['🚀 Bot starting...']);
      
      const config: BotConfig = {
        market,
        contractType,
        stake,
        duration,
        digit: targetDigit,
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
    setJournalLogs(prev => [...prev, '🗑️ Trade history cleared']);
  };

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-12rem)] gap-4 relative">
      {/* Collapse/Expand Button */}
      <Button
        variant="outline"
        size="icon"
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-20 w-8 rounded-r-lg rounded-l-none border-l-0 shadow-lg"
        onClick={() => setShowBlockMenu(!showBlockMenu)}
      >
        <ChevronRight className={`h-4 w-4 transition-transform ${showBlockMenu ? 'rotate-180' : ''}`} />
      </Button>

      {/* Left Sidebar - Block Menu */}
      {showBlockMenu && (
        <Card className="hidden md:block w-64 flex-shrink-0 bg-card border-border overflow-hidden transition-all">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-primary">Blocks</h3>
          </div>
        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="p-4 space-y-2">
            {blockCategories.map((category) => (
              <div key={category.name} className="mb-4">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
                  <category.icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </div>
                <div className="space-y-1 pl-6">
                  {category.blocks.map((block) => (
                    <div
                      key={block}
                      className="text-xs p-2 bg-secondary/30 rounded border border-primary/20 cursor-grab hover:border-primary transition-colors"
                      draggable
                    >
                      {block}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        </Card>
      )}

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
            Drag blocks to workspace to build your strategy
          </div>
        </Card>

        {/* Workspace */}
        <Card className="flex-1 bg-card border-border overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Default Sections */}
              <div className="space-y-4">
                <div className="border-2 border-primary/30 rounded p-4 bg-primary/5">
                  <h4 className="text-sm font-semibold text-primary mb-3">Trade Parameters</h4>
                  <div className="space-y-3">
                    <div className="bg-secondary/50 p-3 rounded border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Market</label>
                      <select 
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                        value={market}
                        onChange={(e) => setMarket(e.target.value)}
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
                        <option value="RDBEAR">Bear Market Index</option>
                        <option value="RDBULL">Bull Market Index</option>
                      </select>
                    </div>
                    <div className="bg-secondary/50 p-3 rounded border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Contract Type</label>
                      <select 
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                      >
                        <option>Matches/Differs</option>
                        <option>Even/Odd</option>
                        <option>Over/Under</option>
                        <option>Rise/Fall</option>
                      </select>
                    </div>
                    <div className="bg-secondary/50 p-3 rounded border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Stake Amount ($)</label>
                      <input 
                        type="number" 
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs" 
                        value={stake} 
                        onChange={(e) => setStake(Number(e.target.value))}
                        step="0.01"
                        min="0.35"
                        disabled={isRunning}
                      />
                    </div>
                    <div className="bg-secondary/50 p-3 rounded border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Duration (Ticks)</label>
                      <input 
                        type="number" 
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs" 
                        value={duration} 
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min="1"
                        disabled={isRunning}
                      />
                    </div>
                    <div className="bg-secondary/50 p-3 rounded border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Take Profit ($)</label>
                      <input 
                        type="number" 
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs" 
                        value={takeProfit} 
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                        step="0.01"
                        min="0"
                        disabled={isRunning}
                      />
                    </div>
                    <div className="bg-secondary/50 p-3 rounded border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Stop Loss ($)</label>
                      <input 
                        type="number" 
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs" 
                        value={stopLoss} 
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                        step="0.01"
                        min="0"
                        disabled={isRunning}
                      />
                    </div>
                    <div className="bg-secondary/50 p-3 rounded border border-primary/20 hover:border-primary/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="trade-every-tick" className="text-xs text-muted-foreground cursor-pointer">
                          Trade on Every Tick
                        </Label>
                        <Switch
                          id="trade-every-tick"
                          checked={tradeOnEveryTick}
                          onCheckedChange={setTradeOnEveryTick}
                          disabled={isRunning}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground/70 mt-1">Execute trades on every tick without delay</p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-blue-500/30 rounded p-4 bg-blue-500/5">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3">Purchase Condition</h4>
                  <div className="space-y-3">
                    <div className="bg-secondary/50 p-3 rounded border border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Condition Type</label>
                      <select 
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs mb-2"
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                      >
                        <option>Matches/Differs</option>
                        <option>Even/Odd</option>
                        <option>Over/Under</option>
                      </select>
                      {(contractType.includes('Matches') || contractType.includes('Differs') || contractType.includes('Over') || contractType.includes('Under')) && (
                        <>
                          <label className="text-xs text-muted-foreground block mb-1">Target Digit</label>
                          <input 
                            type="number" 
                            className="w-full bg-background border border-border rounded px-2 py-1 text-xs" 
                            value={targetDigit} 
                            onChange={(e) => setTargetDigit(Number(e.target.value))}
                            min="0" 
                            max="9" 
                            disabled={isRunning}
                          />
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground px-3">(Drag more conditions from block menu to add complex logic)</div>
                  </div>
                </div>

                <div className="border-2 border-green-500/30 rounded p-4 bg-green-500/5">
                  <h4 className="text-sm font-semibold text-green-400 mb-3">Sell Condition</h4>
                  <div className="space-y-3">
                    <div className="bg-secondary/50 p-3 rounded border border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Profit Target ($)</label>
                      <input type="number" className="w-full bg-background border border-border rounded px-2 py-1 text-xs" defaultValue="5.00" step="0.01" />
                    </div>
                    <div className="bg-secondary/50 p-3 rounded border border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Stop Loss ($)</label>
                      <input type="number" className="w-full bg-background border border-border rounded px-2 py-1 text-xs" defaultValue="-10.00" step="0.01" />
                    </div>
                  </div>
                </div>

                <div className="border-2 border-yellow-500/30 rounded p-4 bg-yellow-500/5">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-3">Restart Trade Condition (Martingale)</h4>
                  <div className="space-y-3">
                    <div className="bg-secondary/50 p-3 rounded border border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Martingale Multiplier</label>
                      <input 
                        type="number" 
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs" 
                        value={martingaleMultiplier}
                        onChange={(e) => setMartingaleMultiplier(Number(e.target.value))}
                        step="0.1" 
                        min="1"
                        disabled={isRunning}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Multiply stake by this amount on loss</p>
                    </div>
                    <div className="bg-secondary/50 p-3 rounded border border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer">
                      <label className="text-xs text-muted-foreground block mb-1">Max Stake ($)</label>
                      <input 
                        type="number" 
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs" 
                        value={maxStake}
                        onChange={(e) => setMaxStake(Number(e.target.value))}
                        step="1" 
                        min="1"
                        disabled={isRunning}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Maximum stake allowed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drop Zone for new blocks */}
              <div className="border-2 border-dashed border-border rounded p-8 text-center text-muted-foreground">
                <p className="text-sm">Drop additional blocks here to extend your strategy</p>
              </div>
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Right Panel - Results (Collapsible) */}
      {showResults && (
        <Card className="w-80 flex-shrink-0 bg-card border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-primary">Running</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResults(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Tabs defaultValue="journal" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="journal" className="text-xs">Journal</TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs">Trades</TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="journal" className="flex-1 m-4 mt-2">
              <ScrollArea className="h-[calc(100vh-20rem)] bg-muted/30 rounded p-3">
                {journalLogs.length > 0 ? (
                  <div className="space-y-2 text-xs mono">
                    {journalLogs.map((log, idx) => (
                      <div key={idx} className={
                        log.includes('success') ? 'text-green-400' :
                        log.includes('Executing') ? 'text-yellow-400' :
                        log.includes('error') || log.includes('stopped') ? 'text-red-400' :
                        'text-blue-400'
                      }>
                        [{new Date().toLocaleTimeString()}] {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center">
                    Press Run to start
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="transactions" className="flex-1 m-4 mt-2">
              <ScrollArea className="h-[calc(100vh-20rem)] bg-muted/30 rounded p-3">
                {trades.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {trades.map((trade, idx) => (
                      <div key={idx} className={`p-2 rounded border ${
                        trade.status === 'won' ? 'bg-green-500/10 border-green-500/30' :
                        trade.status === 'lost' ? 'bg-red-500/10 border-red-500/30' :
                        'bg-blue-500/10 border-blue-500/30'
                      }`}>
                        <div className="font-mono text-xs text-muted-foreground">{trade.contractId}</div>
                        <div className="flex justify-between mt-1">
                          <span>Buy: {trade.buyPrice.toFixed(2)}</span>
                          {trade.sellPrice && <span>Sell: {trade.sellPrice.toFixed(2)}</span>}
                        </div>
                        {trade.profit !== undefined && (
                          <div className={`font-bold ${trade.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.profit > 0 ? '+' : ''}{trade.profit.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center">
                    Transactions will appear here
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="summary" className="flex-1 m-4 mt-2">
              <div className="space-y-4 text-sm">
                <div className="bg-muted/30 rounded p-3">
                  <div className="text-muted-foreground">Total Trades</div>
                  <div className="text-2xl font-bold text-primary">{trades.length}</div>
                </div>
                <div className="bg-muted/30 rounded p-3">
                  <div className="text-muted-foreground">Profit/Loss</div>
                  <div className={`text-2xl font-bold ${
                    trades.reduce((sum, t) => sum + (t.profit || 0), 0) > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {trades.reduce((sum, t) => sum + (t.profit || 0), 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-muted/30 rounded p-3">
                  <div className="text-muted-foreground">Win Rate</div>
                  <div className="text-2xl font-bold text-primary">
                    {trades.length > 0 
                      ? ((trades.filter(t => t.status === 'won').length / trades.length) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Show Results Button (when collapsed) */}
      {!showResults && (
        <Button
          variant="outline"
          size="sm"
          className="fixed right-4 top-32"
          onClick={() => setShowResults(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default BotBuilder;
