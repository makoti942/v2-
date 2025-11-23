import { useState, useEffect, useRef, useCallback } from 'react';
import * as Blockly from 'blockly';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Square, Save, Upload, Undo2, Redo2, ZoomIn, ZoomOut, 
  Maximize2, Menu, X, Trash2, HelpCircle, Wifi, WifiOff 
} from 'lucide-react';
import { defineCustomBlocks, getToolbox, getDefaultWorkspace } from '@/utils/blocklyBlocks';
import { useBotTrading, BotConfig } from '@/hooks/useBotTrading';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import './BlocklyBotBuilder.css';

export const BlocklyBotBuilder = () => {
  const { user, resetBalance } = useAuth();
  const [workspace, setWorkspace] = useState<Blockly.WorkspaceSvg | null>(null);
  const [journalLogs, setJournalLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [showBlockMenu, setShowBlockMenu] = useState(true);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [summaryMinimized, setSummaryMinimized] = useState(false);
  const blocklyDiv = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setJournalLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const { isRunning, trades, start, stop, resetTrades } = useBotTrading(addLog);

  useEffect(() => {
    if (!blocklyDiv.current || workspace) return;
    defineCustomBlocks();
    const ws = Blockly.inject(blocklyDiv.current, {
      toolbox: null,
      grid: { spacing: 24, length: 3, colour: '#e0e0e0', snap: true },
      zoom: { controls: false, wheel: true, startScale: 1, maxScale: 2, minScale: 0.25, scaleSpeed: 1.1 },
      trashcan: true,
      scrollbars: true,
      move: { scrollbars: { horizontal: true, vertical: true }, drag: true, wheel: true }
    });
    setWorkspace(ws);
    const savedWorkspace = localStorage.getItem('makoti_workspace_v1');
    if (savedWorkspace) {
      try { Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(savedWorkspace), ws); }
      catch { Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(getDefaultWorkspace()), ws); }
    } else { Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(getDefaultWorkspace()), ws); }
    let saveTimeout: NodeJS.Timeout;
    ws.addChangeListener(() => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const xml = Blockly.Xml.workspaceToDom(ws);
        const xmlText = Blockly.Xml.domToText(xml);
        localStorage.setItem('makoti_workspace_v1', xmlText);
      }, 500);
    });
  }, [workspace]);

  const addBlockToWorkspace = (blockType: string) => {
    if (!workspace) return;
    const block = workspace.newBlock(blockType);
    block.initSvg();
    block.render();
    const metrics = workspace.getMetrics();
    const x = metrics.viewLeft + metrics.viewWidth / 2;
    const y = metrics.viewTop + metrics.viewHeight / 2;
    block.moveBy(x - 100, y - 50);
    workspace.scrollCenter();
    toast.success('Block added to workspace');
  };

  const extractBotConfig = (): BotConfig | null => {
    if (!workspace) return null;
    const blocks = workspace.getAllBlocks();
    const config: Partial<BotConfig> = {
      market: 'R_10', contractType: 'Matches', stake: 0.35, duration: 1, digit: 0,
      takeProfit: 10, stopLoss: 10, tradeOnEveryTick: false, martingaleMultiplier: 2, maxStake: 100
    };
    blocks.forEach(block => {
      switch (block.type) {
        case 'trade_parameters':
          config.market = block.getFieldValue('MARKET');
          config.stake = Number(block.getFieldValue('STAKE'));
          config.duration = Number(block.getFieldValue('DURATION'));
          config.takeProfit = Number(block.getFieldValue('TAKE_PROFIT'));
          config.stopLoss = Number(block.getFieldValue('STOP_LOSS'));
          break;
        case 'purchase_matches': config.contractType = 'Matches'; config.digit = Number(block.getFieldValue('DIGIT')); break;
        case 'purchase_differs': config.contractType = 'Differs'; config.digit = Number(block.getFieldValue('DIGIT')); break;
        case 'purchase_over': config.contractType = 'Over'; config.digit = Number(block.getFieldValue('DIGIT')); break;
        case 'purchase_under': config.contractType = 'Under'; config.digit = Number(block.getFieldValue('DIGIT')); break;
        case 'purchase_even': config.contractType = 'Even'; break;
        case 'purchase_odd': config.contractType = 'Odd'; break;
        case 'trade_on_tick': config.tradeOnEveryTick = block.getFieldValue('ENABLED') === 'TRUE'; break;
        case 'martingale': config.martingaleMultiplier = Number(block.getFieldValue('MULTIPLIER')); break;
      }
    });
    return config as BotConfig;
  };

  const handleRun = () => {
    const config = extractBotConfig();
    if (!config) { toast.error('Invalid bot configuration'); return; }
    if (user?.activeAccount?.type === 'real' && user.balance < config.stake) {
      toast.error('Insufficient balance'); return;
    }
    addLog('🚀 Starting bot...');
    setShowSummaryPanel(true);
    setSummaryMinimized(false);
    start(config);
  };

  const handleStop = () => { addLog('🛑 Stopping bot...'); stop(); };

  const handleSave = () => {
    if (!workspace) return;
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);
    const blob = new Blob([xmlText], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'makoti-bot.xml';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Bot saved successfully');
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspace) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlText = event.target?.result as string;
      workspace.clear();
      Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xmlText), workspace);
      toast.success('Bot loaded successfully');
    };
    reader.readAsText(file);
  };

  const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const wins = trades.filter(t => t.status === 'won').length;
  const losses = trades.filter(t => t.status === 'lost').length;
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : '0';

  return (
    <div className="h-screen flex bg-background">
      <div className="vertical-rail">
        <Button size="icon" onClick={() => setShowBlockMenu(!showBlockMenu)}><Menu className="h-5 w-5"/></Button>
        <Button size="icon" onClick={handleSave}><Save className="h-4 w-4"/></Button>
        <label>
          <Button size="icon" asChild><span><Upload className="h-4 w-4"/></span></Button>
          <input type="file" accept=".xml" onChange={handleLoad} className="hidden"/>
        </label>
        <Button size="icon" onClick={() => workspace?.undo(false)}><Undo2 className="h-4 w-4"/></Button>
        <Button size="icon" onClick={() => workspace?.undo(true)}><Redo2 className="h-4 w-4"/></Button>
        <Button size="lg" onClick={isRunning ? handleStop : handleRun}>{isRunning ? <Square/> : <Play/>}</Button>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="top-toolbar">
          <h1 className="text-sm md:text-lg font-bold">Makoti Bot Builder</h1>
          <Badge variant={isConnected ? "default" : "destructive"}>{isConnected ? 'Connected' : 'Disconnected'}</Badge>
        </div>

        {showBlockMenu && (
          <div className="block-menu">
            <h4>Trade Parameters</h4>
            <Button onClick={() => addBlockToWorkspace('trade_parameters')}>Trade Parameters</Button>
            <h4>Purchase Conditions</h4>
            <Button onClick={() => addBlockToWorkspace('purchase_matches')}>Matches</Button>
            <Button onClick={() => addBlockToWorkspace('purchase_differs')}>Differs</Button>
            <Button onClick={() => addBlockToWorkspace('purchase_over')}>Over</Button>
            <Button onClick={() => addBlockToWorkspace('purchase_under')}>Under</Button>
            <Button onClick={() => addBlockToWorkspace('purchase_even')}>Even</Button>
            <Button onClick={() => addBlockToWorkspace('purchase_odd')}>Odd</Button>
            <h4>Stake Management</h4>
            <Button onClick={() => addBlockToWorkspace('martingale')}>Martingale</Button>
            <h4>Options</h4>
            <Button onClick={() => addBlockToWorkspace('trade_on_tick')}>Trade Every Tick</Button>
          </div>
        )}

        <div ref={blocklyDiv} className="flex-1" style={{ minHeight: '100%', minWidth: '100%' }}></div>
      </div>
    </div>
  );
};
