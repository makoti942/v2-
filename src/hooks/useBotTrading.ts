import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface BotConfig {
  market: string;
  contractType: string;
  stake: number;
  duration: number;
  digit?: number;
  takeProfit: number;
  stopLoss: number;
  tradeOnEveryTick?: boolean;
  martingaleMultiplier?: number;
  maxStake?: number;
}

export interface TradeResult {
  contractId: string;
  buyPrice: number;
  sellPrice?: number;
  profit?: number;
  status: 'open' | 'won' | 'lost';
  timestamp: number;
}

const PROPOSAL_TIMEOUT_MS = 4000;
const BUY_TIMEOUT_MS = 4000;
const MAX_RETRIES = 3;

export const useBotTrading = (onLog: (message: string) => void) => {
  const { user, updateBalance } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [trades, setTrades] = useState<TradeResult[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const activeContractsRef = useRef<Set<string>>(new Set());
  const configRef = useRef<BotConfig | null>(null);
  const totalProfitRef = useRef<number>(0);
  const isExecutingRef = useRef<boolean>(false);
  const messageListenersRef = useRef<Array<(data: any) => void>>([]);
  const baseStakeRef = useRef<number>(0);
  const currentStakeRef = useRef<number>(0);
  const martingaleMultiplierRef = useRef<number>(2);
  const maxStakeRef = useRef<number>(100);

  // Safe send with readyState check and timeout
  const safeSend = useCallback((payload: any): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!wsRef.current) {
        resolve(false);
        return;
      }

      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(payload));
        resolve(true);
        return;
      }

      // Wait for connection with timeout
      let timeout: NodeJS.Timeout;
      const checkReady = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(checkReady);
          clearTimeout(timeout);
          wsRef.current.send(JSON.stringify(payload));
          resolve(true);
        }
      }, 100);

      timeout = setTimeout(() => {
        clearInterval(checkReady);
        resolve(false);
      }, 4000);
    });
  }, []);

  // Wait for specific message with timeout
  const waitForMessage = useCallback((predicate: (data: any) => boolean, timeoutMs: number): Promise<any> => {
    return new Promise((resolve) => {
      let timeout: NodeJS.Timeout;
      
      const listener = (data: any) => {
        if (predicate(data)) {
          clearTimeout(timeout);
          const index = messageListenersRef.current.indexOf(listener);
          if (index > -1) {
            messageListenersRef.current.splice(index, 1);
          }
          resolve(data);
        }
      };

      messageListenersRef.current.push(listener);

      timeout = setTimeout(() => {
        const index = messageListenersRef.current.indexOf(listener);
        if (index > -1) {
          messageListenersRef.current.splice(index, 1);
        }
        resolve(null);
      }, timeoutMs);
    });
  }, []);

  // Apply Martingale logic
  const applyMartingale = useCallback((isWin: boolean) => {
    if (isWin) {
      currentStakeRef.current = baseStakeRef.current;
      onLog(`💰 Stake reset to base: ${currentStakeRef.current.toFixed(2)}`);
    } else {
      const newStake = currentStakeRef.current * martingaleMultiplierRef.current;
      const cappedStake = Math.min(newStake, maxStakeRef.current);
      
      if (cappedStake >= maxStakeRef.current) {
        onLog(`⚠️ Martingale stake capped at max: ${maxStakeRef.current.toFixed(2)}`);
      }
      
      currentStakeRef.current = cappedStake;
      onLog(`📈 Martingale stake updated: ${currentStakeRef.current.toFixed(2)} (${martingaleMultiplierRef.current}x multiplier)`);
    }
  }, [onLog]);

  // Main proposal and buy flow
  const sendProposalAndBuy = useCallback(async (config: BotConfig, retryCount = 0): Promise<void> => {
    if (!wsRef.current || !isRunning) return;

    const balance = user?.balance || 0;
    const stakeToUse = currentStakeRef.current;

    if (balance < stakeToUse) {
      onLog(`⚠️ Insufficient balance: ${balance.toFixed(2)} ${user?.activeAccount.currency}`);
      stop();
      return;
    }

    // Build contract type
    let contractType = 'DIGITMATCH';
    let selectedDigit = config.digit;
    
    if (config.contractType.toLowerCase().includes('match')) {
      contractType = 'DIGITMATCH';
    } else if (config.contractType.toLowerCase().includes('differ')) {
      contractType = 'DIGITDIFF';
    } else if (config.contractType.toLowerCase().includes('even')) {
      contractType = 'DIGITEVEN';
      selectedDigit = undefined;
    } else if (config.contractType.toLowerCase().includes('odd')) {
      contractType = 'DIGITODD';
      selectedDigit = undefined;
    } else if (config.contractType.toLowerCase().includes('over')) {
      contractType = 'DIGITOVER';
    } else if (config.contractType.toLowerCase().includes('under')) {
      contractType = 'DIGITUNDER';
    }

    // Build proposal payload
    const proposalParams: any = {
      proposal: 1,
      amount: stakeToUse,
      basis: 'stake',
      contract_type: contractType,
      currency: user!.activeAccount.currency,
      duration: config.duration,
      duration_unit: 't',
      symbol: config.market
    };

    if (selectedDigit !== undefined && 
        (contractType === 'DIGITMATCH' || contractType === 'DIGITDIFF' || 
         contractType === 'DIGITOVER' || contractType === 'DIGITUNDER')) {
      proposalParams.barrier = selectedDigit.toString();
    }

    onLog(`📤 Proposal sent (stake: ${stakeToUse.toFixed(2)}, type: ${contractType})`);

    // Send proposal
    const sent = await safeSend(proposalParams);
    if (!sent) {
      onLog(`❌ Failed to send proposal`);
      if (retryCount < MAX_RETRIES) {
        onLog(`🔄 Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await sendProposalAndBuy(config, retryCount + 1);
      }
      return;
    }

    // Wait for proposal response
    const proposalMsg = await waitForMessage(
      (data) => data.proposal !== undefined,
      PROPOSAL_TIMEOUT_MS
    );

    if (!proposalMsg) {
      onLog(`⏱️ Proposal timeout`);
      if (retryCount < MAX_RETRIES) {
        onLog(`🔄 Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await sendProposalAndBuy(config, retryCount + 1);
      }
      return;
    }

    const proposalId = proposalMsg.proposal.id;
    const askPrice = Number(proposalMsg.proposal.ask_price || proposalMsg.proposal.display_value);
    onLog(`✅ Proposal received (id: ${proposalId}, ask: ${askPrice.toFixed(2)} ${user!.activeAccount.currency})`);

    // Send buy
    onLog(`📤 Buy sent (proposal id: ${proposalId})`);
    const buySent = await safeSend({ buy: proposalId, price: askPrice });
    
    if (!buySent) {
      onLog(`❌ Failed to send buy`);
      return;
    }

    // Wait for buy confirmation
    const buyMsg = await waitForMessage(
      (data) => data.buy !== undefined || data.error?.code === 'ContractCreationFailure',
      BUY_TIMEOUT_MS
    );

    if (!buyMsg || buyMsg.error) {
      onLog(`❌ Buy failed or timeout`);
      return;
    }

    const contract = buyMsg.buy;
    onLog(`✅ Buy accepted! Contract: ${contract.contract_id}`);
    onLog(`💰 Stake: ${contract.buy_price} ${user!.activeAccount.currency}`);
    
    activeContractsRef.current.add(contract.contract_id);
    
    setTrades(prev => [...prev, {
      contractId: contract.contract_id,
      buyPrice: Number(contract.buy_price),
      status: 'open',
      timestamp: Date.now()
    }]);

    // Subscribe to contract updates
    await safeSend({
      proposal_open_contract: 1,
      contract_id: contract.contract_id,
      subscribe: 1
    });
  }, [user, onLog, isRunning, safeSend, waitForMessage, applyMartingale]);

  const connect = useCallback(() => {
    if (!user) return;

    // Reuse existing connection if already open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      onLog('⚡ Using existing connection');
      return;
    }

    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=109236');
    wsRef.current = ws;

    ws.onopen = async () => {
      onLog('⚡ Connected to Deriv');
      await safeSend({ authorize: user.activeAccount.token });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Notify all listeners
      messageListenersRef.current.forEach(listener => listener(data));

      if (data.authorize) {
        onLog(`✅ Authorized: ${data.authorize.loginid}`);
        const balance = Number(data.authorize.balance);
        updateBalance(balance);
        
        safeSend({ balance: 1, subscribe: 1 });
        
        if (configRef.current) {
          safeSend({ ticks: configRef.current.market, subscribe: 1 });
          onLog(`📊 Subscribed to ${configRef.current.market} ticks`);
          
          // Start first trade immediately
          if (!isExecutingRef.current) {
            isExecutingRef.current = true;
            sendProposalAndBuy(configRef.current).finally(() => {
              isExecutingRef.current = false;
            });
          }
        }
      }

      if (data.balance) {
        updateBalance(Number(data.balance.balance));
      }

      if (data.proposal_open_contract) {
        const contract = data.proposal_open_contract;
        
        if (contract.is_sold || contract.status === 'sold') {
          const profit = Number(contract.profit);
          const sellPrice = Number(contract.sell_price);
          
          totalProfitRef.current += profit;
          
          setTrades(prev => prev.map(t => 
            t.contractId === contract.contract_id 
              ? { 
                  ...t, 
                  sellPrice,
                  profit,
                  status: profit > 0 ? 'won' : 'lost'
                }
              : t
          ));

          activeContractsRef.current.delete(contract.contract_id);

          const isWin = profit > 0;
          if (isWin) {
            onLog(`🎉 WON! Profit: +${profit.toFixed(2)} ${user.activeAccount.currency} | Total: ${totalProfitRef.current.toFixed(2)}`);
          } else {
            onLog(`❌ LOST! Loss: ${profit.toFixed(2)} ${user.activeAccount.currency} | Total: ${totalProfitRef.current.toFixed(2)}`);
          }

          // Apply Martingale
          applyMartingale(isWin);

          // Check stop conditions
          if (configRef.current) {
            if (totalProfitRef.current >= configRef.current.takeProfit) {
              onLog(`🎯 Take Profit reached! Total: +${totalProfitRef.current.toFixed(2)} ${user.activeAccount.currency}`);
              stop();
              return;
            }
            
            if (totalProfitRef.current <= -configRef.current.stopLoss) {
              onLog(`🛑 Stop Loss reached! Total: ${totalProfitRef.current.toFixed(2)} ${user.activeAccount.currency}`);
              stop();
              return;
            }
          }

          // Continue trading
          if (isRunning && configRef.current && !isExecutingRef.current) {
            isExecutingRef.current = true;
            setTimeout(() => {
              if (configRef.current) {
                sendProposalAndBuy(configRef.current).finally(() => {
                  isExecutingRef.current = false;
                });
              }
            }, 500);
          }
        }
      }

      if (data.error) {
        onLog(`❌ Error: ${data.error.message}`);
        console.error('Trading error:', data.error);
        isExecutingRef.current = false;
      }
    };

    ws.onerror = (error) => {
      console.error('Trading WebSocket error:', error);
      onLog('⚠️ Connection error - attempting reconnect...');
    };

    ws.onclose = () => {
      onLog('❌ Connection closed');
      if (isRunning && configRef.current) {
        setTimeout(() => {
          onLog('🔄 Reconnecting...');
          connect();
        }, 3000);
      }
    };
  }, [user, updateBalance, onLog, safeSend, waitForMessage, sendProposalAndBuy, applyMartingale, isRunning]);


  const start = useCallback((config: BotConfig) => {
    setIsRunning(true);
    activeContractsRef.current.clear();
    messageListenersRef.current = [];
    configRef.current = config;
    totalProfitRef.current = 0;
    isExecutingRef.current = false;
    
    // Set Martingale parameters
    baseStakeRef.current = config.stake;
    currentStakeRef.current = config.stake;
    martingaleMultiplierRef.current = config.martingaleMultiplier || 2;
    maxStakeRef.current = config.maxStake || 100;
    
    onLog('🚀 Starting bot...');
    onLog(`💰 Base Stake: ${config.stake} | TP: ${config.takeProfit} | SL: ${config.stopLoss}`);
    onLog(`📈 Martingale: ${martingaleMultiplierRef.current}x multiplier, max: ${maxStakeRef.current}`);
    
    connect();
  }, [connect, onLog]);

  const stop = useCallback(() => {
    setIsRunning(false);
    configRef.current = null;
    isExecutingRef.current = false;
    messageListenersRef.current = [];
    
    // Keep WebSocket alive for faster reconnection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      safeSend({ forget_all: 'ticks' });
    }
    
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.status === 'won').length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0';
    
    onLog('🛑 Bot stopped');
    onLog(`📊 Summary: ${totalTrades} trades | Win rate: ${winRate}% | Total P/L: ${totalProfitRef.current.toFixed(2)}`);
  }, [onLog, trades, safeSend]);

  const resetTrades = useCallback(() => {
    setTrades([]);
    totalProfitRef.current = 0;
  }, []);

  return {
    isRunning,
    trades,
    start,
    stop,
    resetTrades
  };
};
