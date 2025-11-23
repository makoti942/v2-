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

  const safeSend = useCallback((payload: any): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        resolve(false);
        return;
      }
      wsRef.current.send(JSON.stringify(payload));
      resolve(true);
    });
  }, []);

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
        resolve(null); // Resolve with null on timeout
      }, timeoutMs);
    });
  }, []);

  const applyMartingale = useCallback((isWin: boolean) => {
    if (isWin) {
      currentStakeRef.current = baseStakeRef.current;
      onLog(`💰 Stake reset to base: ${currentStakeRef.current.toFixed(2)}`);
    } else {
      const newStake = currentStakeRef.current * martingaleMultiplierRef.current;
      currentStakeRef.current = Math.min(newStake, maxStakeRef.current);
      
      if (currentStakeRef.current >= maxStakeRef.current) {
        onLog(`⚠️ Martingale stake capped at max: ${maxStakeRef.current.toFixed(2)}`);
      }
      onLog(`📈 Martingale stake updated: ${currentStakeRef.current.toFixed(2)}`);
    }
  }, [onLog]);

  const stop = useCallback((reason?: string) => {
    if (!isRunning) return;
    setIsRunning(false);
    const finalReason = reason || 'Bot stopped by user';
    onLog(`🛑 ${finalReason}`);

    if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
            safeSend({ forget_all: 'ticks' });
        }
        wsRef.current.close();
        wsRef.current = null;
    }

    configRef.current = null;
    isExecutingRef.current = false;
    
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.status === 'won').length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0';
    onLog(`📊 Summary: ${totalTrades} trades | Win rate: ${winRate}% | Total P/L: ${totalProfitRef.current.toFixed(2)}`);
  }, [isRunning, onLog, trades, safeSend]);


  const sendProposalAndBuy = useCallback(async (retryCount = 0): Promise<void> => {
    if (!isRunning || !configRef.current) return;

    const config = configRef.current;
    const balance = user?.balance || 0;
    const stakeToUse = currentStakeRef.current;

    if (balance < stakeToUse) {
      stop('Insufficient balance');
      return;
    }

    let apiContractType = '';
    switch (config.contractType) {
      case 'Digit Matches': apiContractType = 'DIGITMATCH'; break;
      case 'Digit Differs': apiContractType = 'DIGITDIFF'; break;
      case 'Digit Even': apiContractType = 'DIGITEVEN'; break;
      case 'Digit Odd': apiContractType = 'DIGITODD'; break;
      case 'Digit Over': apiContractType = 'DIGITOVER'; break;
      case 'Digit Under': apiContractType = 'DIGITUNDER'; break;
      default: stop(`Unknown contract type: ${config.contractType}`); return;
    }

    const proposalParams: any = {
      proposal: 1, amount: stakeToUse, basis: 'stake', contract_type: apiContractType,
      currency: user!.activeAccount.currency, duration: config.duration, duration_unit: 't', symbol: config.market
    };

    if (config.digit !== undefined && ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(apiContractType)) {
      proposalParams.barrier = config.digit.toString();
    }

    onLog(`📤 Sending proposal (Stake: ${stakeToUse.toFixed(2)})`);
    const sent = await safeSend(proposalParams);
    if (!sent) {
      if (retryCount < MAX_RETRIES) {
        onLog(`🔄 Retrying proposal... (${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => sendProposalAndBuy(retryCount + 1), 500);
      } else {
        stop('Failed to send proposal');
      }
      return;
    }

    const proposalMsg = await waitForMessage((data) => data.proposal !== undefined, PROPOSAL_TIMEOUT_MS);
    if (!proposalMsg) {
        if (retryCount < MAX_RETRIES) {
            onLog(`🔄 Retrying proposal (timeout)... (${retryCount + 1}/${MAX_RETRIES})`);
            setTimeout(() => sendProposalAndBuy(retryCount + 1), 500);
        } else {
            stop('Proposal timeout');
        }
        return;
    }

    const { id: proposalId, ask_price } = proposalMsg.proposal;
    onLog(`✅ Proposal received (ID: ${proposalId})`);

    const buySent = await safeSend({ buy: proposalId, price: ask_price });
    if (!buySent) {
      stop('Failed to send buy request');
      return;
    }

    const buyMsg = await waitForMessage((data) => data.buy !== undefined || data.error?.code === 'ContractCreationFailure', BUY_TIMEOUT_MS);
    if (!buyMsg || buyMsg.error) {
      onLog(`❌ Buy failed: ${buyMsg?.error?.message || 'Timeout'}`);
      // Don't stop the bot, just log failure and continue
       isExecutingRef.current = false;
       if (isRunning && !configRef.current?.tradeOnEveryTick) {
            // Immediately try to trade again
            if(!isExecutingRef.current) {
                isExecutingRef.current = true;
                sendProposalAndBuy().finally(() => { isExecutingRef.current = false; });
            }
       }
      return;
    }

    const { contract_id, buy_price } = buyMsg.buy;
    onLog(`✅ Trade purchased (ID: ${contract_id})`);
    activeContractsRef.current.add(contract_id);
    setTrades(prev => [...prev, { contractId: contract_id, buyPrice: Number(buy_price), status: 'open', timestamp: Date.now() }]);

    await safeSend({ proposal_open_contract: 1, contract_id: contract_id, subscribe: 1 });
  }, [user, onLog, isRunning, safeSend, waitForMessage, applyMartingale, stop]);


  const handleTradeFinished = useCallback((contract: any) => {
    if (!activeContractsRef.current.has(contract.contract_id)) return;

    const profit = Number(contract.profit);
    totalProfitRef.current += profit;
    
    setTrades(prev => prev.map(t => t.contractId === contract.contract_id ? { ...t, sellPrice: Number(contract.sell_price), profit, status: profit >= 0 ? 'won' : 'lost' } : t));
    activeContractsRef.current.delete(contract.contract_id);

    const isWin = profit >= 0;
    onLog(`${isWin ? '🎉 WON' : '❌ LOST'}: ${profit.toFixed(2)} ${user!.activeAccount.currency} | Total P/L: ${totalProfitRef.current.toFixed(2)}`);

    applyMartingale(isWin);

    if (configRef.current) {
        if (totalProfitRef.current >= configRef.current.takeProfit) {
            stop('Take Profit reached');
            return;
        }
        if (totalProfitRef.current <= -configRef.current.stopLoss) {
            stop('Stop Loss reached');
            return;
        }
    }

    // If not trading on every tick, trigger the next trade immediately after the previous one finishes.
    if (isRunning && !isExecutingRef.current && !configRef.current?.tradeOnEveryTick) {
        isExecutingRef.current = true;
        sendProposalAndBuy().finally(() => {
            isExecutingRef.current = false;
        });
    }
  }, [user, applyMartingale, stop, sendProposalAndBuy, isRunning]);

  const connect = useCallback(() => {
    if (!user || !configRef.current) return;

    wsRef.current = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${process.env.REACT_APP_DERIV_APP_ID || '109236'}`);
    const ws = wsRef.current;

    ws.onopen = async () => {
      onLog('⚡ Connected to Deriv');
      await safeSend({ authorize: user.activeAccount.token });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      messageListenersRef.current.forEach(l => l(data));

      if (data.error) {
        onLog(`❌ API Error: ${data.error.message}`);
        if (data.error.code === 'InvalidToken' || data.error.code === 'AuthorizationRequired') {
            stop('Authorization failed');
        }
        return;
      }

      if (data.authorize) {
        onLog(`✅ Authorized: ${data.authorize.loginid}`);
        updateBalance(Number(data.authorize.balance));
        safeSend({ balance: 1, subscribe: 1 });
        safeSend({ ticks: configRef.current!.market, subscribe: 1 });
      }

      if (data.balance) {
        updateBalance(Number(data.balance.balance));
      }

      if (data.ticks && !isExecutingRef.current) {
        if (configRef.current?.tradeOnEveryTick || trades.length === 0) {
          isExecutingRef.current = true;
          sendProposalAndBuy().finally(() => {
            isExecutingRef.current = false;
          });
        }
      }

      if (data.proposal_open_contract && data.proposal_open_contract.is_sold) {
        handleTradeFinished(data.proposal_open_contract);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onLog('⚠️ Connection error');
    };

    ws.onclose = () => {
      onLog('❌ Connection closed');
      if (isRunning) {
        setTimeout(() => { onLog('🔄 Reconnecting...'); connect(); }, 3000);
      }
    };
  }, [user, updateBalance, onLog, safeSend, isRunning, stop, sendProposalAndBuy, handleTradeFinished, trades]);

  const start = useCallback((config: BotConfig) => {
    setIsRunning(true);
    setTrades([]);
    activeContractsRef.current.clear();
    messageListenersRef.current = [];
    configRef.current = config;
    totalProfitRef.current = 0;
    isExecutingRef.current = false;
    
    baseStakeRef.current = config.stake;
    currentStakeRef.current = config.stake;
    martingaleMultiplierRef.current = config.martingaleMultiplier || 2;
    maxStakeRef.current = config.maxStake || 100;
    
    onLog('🚀 Starting bot...');
    onLog(`💰 Config: Stake ${config.stake} | TP ${config.takeProfit} | SL ${config.stopLoss}`);
    onLog(`📈 Martingale: ${martingaleMultiplierRef.current}x, max ${maxStakeRef.current}`);
    
    connect();
  }, [connect, onLog]);

  const resetTrades = useCallback(() => {
    setTrades([]);
    totalProfitRef.current = 0;
  }, []);

  return { isRunning, trades, start, stop, resetTrades };
};