import { Tick } from '@/hooks/useDerivWebSocket';

export interface StrategyResult {
  predictedDigit: number | null;
  confidence: number;
  reason?: string;
}

// Technical Indicators

// RSI Calculation
export const calculateRSI = (ticks: Tick[], period: number = 14): number => {
  if (ticks.length < period + 1) return 50;
  
  const prices = ticks.slice(-period - 1).map(t => t.quote);
  let gains = 0, losses = 0;
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// MACD Calculation
export const calculateMACD = (ticks: Tick[]): { macd: number; signal: number; histogram: number } => {
  if (ticks.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  
  const prices = ticks.map(t => t.quote);
  
  const ema = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let emaValue = data[0];
    for (let i = 1; i < data.length; i++) {
      emaValue = data[i] * k + emaValue * (1 - k);
    }
    return emaValue;
  };
  
  const ema12 = ema(prices.slice(-26), 12);
  const ema26 = ema(prices.slice(-26), 26);
  const macd = ema12 - ema26;
  
  const macdLine = [macd];
  const signal = ema(macdLine, 9);
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
};

// Bollinger Bands
export const calculateBollingerBands = (ticks: Tick[], period: number = 20): { upper: number; middle: number; lower: number; width: number } => {
  if (ticks.length < period) return { upper: 0, middle: 0, lower: 0, width: 0 };
  
  const prices = ticks.slice(-period).map(t => t.quote);
  const sma = prices.reduce((a, b) => a + b, 0) / period;
  
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = sma + (2 * stdDev);
  const lower = sma - (2 * stdDev);
  const width = (upper - lower) / sma;
  
  return { upper, middle: sma, lower, width };
};

// ATR Calculation
export const calculateATR = (ticks: Tick[], period: number = 14): number => {
  if (ticks.length < period + 1) return 0;
  
  const ranges: number[] = [];
  for (let i = 1; i < ticks.length; i++) {
    ranges.push(Math.abs(ticks[i].quote - ticks[i - 1].quote));
  }
  
  return ranges.slice(-period).reduce((a, b) => a + b, 0) / period;
};

// Stochastic Oscillator
export const calculateStochastic = (ticks: Tick[], period: number = 14): { k: number; d: number } => {
  if (ticks.length < period) return { k: 50, d: 50 };
  
  const recent = ticks.slice(-period);
  const prices = recent.map(t => t.quote);
  const current = prices[prices.length - 1];
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  
  const k = low === high ? 50 : ((current - low) / (high - low)) * 100;
  const d = k; // Simplified
  
  return { k, d };
};

// EMA/SMA Crossover
export const calculateMovingAverages = (ticks: Tick[]): { ema: number; sma: number; trend: 'up' | 'down' | 'neutral' } => {
  if (ticks.length < 20) return { ema: 0, sma: 0, trend: 'neutral' };
  
  const prices = ticks.slice(-20).map(t => t.quote);
  const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  const k = 2 / (prices.length + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  const trend = ema > sma ? 'up' : ema < sma ? 'down' : 'neutral';
  
  return { ema, sma, trend };
};

// Candlestick Pattern Recognition
export const detectCandlestickPatterns = (ticks: Tick[]): { pattern: string; bullish: boolean; confidence: number } => {
  if (ticks.length < 5) return { pattern: 'none', bullish: false, confidence: 0 };
  
  const recent = ticks.slice(-5);
  const prices = recent.map(t => t.quote);
  
  // Doji: open ≈ close, small body
  const lastOpen = prices[prices.length - 2];
  const lastClose = prices[prices.length - 1];
  const bodySize = Math.abs(lastClose - lastOpen);
  const avgRange = prices.reduce((sum, p, i) => i > 0 ? sum + Math.abs(p - prices[i - 1]) : sum, 0) / (prices.length - 1);
  
  if (bodySize < avgRange * 0.1) {
    return { pattern: 'doji', bullish: false, confidence: 0.6 };
  }
  
  // Hammer: long lower wick, small upper wick, small body at top
  const recentRange = Math.max(...prices.slice(-3)) - Math.min(...prices.slice(-3));
  const lowerWick = Math.min(...prices.slice(-2)) - Math.min(lastOpen, lastClose);
  const upperWick = Math.max(lastOpen, lastClose) - Math.max(...prices.slice(-2));
  
  if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5) {
    return { pattern: 'hammer', bullish: true, confidence: 0.75 };
  }
  
  // Engulfing: current candle body engulfs previous
  if (prices.length >= 3) {
    const prevOpen = prices[prices.length - 3];
    const prevClose = prices[prices.length - 2];
    const currOpen = prices[prices.length - 2];
    const currClose = prices[prices.length - 1];
    
    if (currClose > currOpen && prevClose < prevOpen && currClose > prevOpen && currOpen < prevClose) {
      return { pattern: 'bullish_engulfing', bullish: true, confidence: 0.8 };
    }
    
    if (currClose < currOpen && prevClose > prevOpen && currClose < prevOpen && currOpen > prevClose) {
      return { pattern: 'bearish_engulfing', bullish: false, confidence: 0.8 };
    }
  }
  
  return { pattern: 'none', bullish: false, confidence: 0 };
};

// Body-to-Wick Ratio Analysis
export const analyzeBodyWickRatio = (ticks: Tick[]): { ratio: number; uncertainty: boolean } => {
  if (ticks.length < 5) return { ratio: 0.5, uncertainty: false };
  
  const recent = ticks.slice(-5);
  const prices = recent.map(t => t.quote);
  
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const open = prices[0];
  const close = prices[prices.length - 1];
  
  const bodySize = Math.abs(close - open);
  const totalRange = high - low;
  
  const ratio = totalRange > 0 ? bodySize / totalRange : 0.5;
  const uncertainty = ratio < 0.3; // Long wicks indicate uncertainty
  
  return { ratio, uncertainty };
};

// Prediction Strategies

// 1. Digit Repetition Strategy
export const digitRepetitionStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 30) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const counts = new Array(10).fill(0);
  ticks.slice(-50).forEach(tick => counts[tick.digit]++);
  
  const maxCount = Math.max(...counts);
  const totalCount = counts.reduce((a, b) => a + b, 0);
  const digit = counts.indexOf(maxCount);
  const frequency = maxCount / totalCount;
  
  return {
    predictedDigit: digit,
    confidence: frequency * 1.2,
    reason: `Digit ${digit} appears ${(frequency * 100).toFixed(1)}% of time`
  };
};

// 2. Sum & Division Pattern
export const sumDivisionStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 10) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const lastN = ticks.slice(-10).map(t => t.digit);
  const sum = lastN.reduce((a, b) => a + b, 0);
  const predictedDigit = sum % 10;
  
  return {
    predictedDigit,
    confidence: 0.6,
    reason: `Sum pattern suggests ${predictedDigit}`
  };
};

// 3. Digit Cluster Probability
export const clusterStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 20) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const recent = ticks.slice(-20);
  const clusters: { [key: number]: number[] } = {};
  
  recent.forEach((tick, idx) => {
    if (!clusters[tick.digit]) clusters[tick.digit] = [];
    clusters[tick.digit].push(idx);
  });
  
  let bestDigit = null;
  let bestScore = 0;
  
  Object.entries(clusters).forEach(([digit, positions]) => {
    const recencyScore = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    const frequencyScore = positions.length;
    const score = recencyScore * frequencyScore;
    
    if (score > bestScore) {
      bestScore = score;
      bestDigit = parseInt(digit);
    }
  });
  
  return {
    predictedDigit: bestDigit,
    confidence: Math.min(bestScore / 100, 0.9),
    reason: `Cluster analysis suggests ${bestDigit}`
  };
};

// 4. Volatility Analysis Strategy
export const volatilityAnalysisStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 20) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const bb = calculateBollingerBands(ticks);
  const atr = calculateATR(ticks);
  
  if (bb.width < 0.02 && atr < 0.01) {
    // Low volatility - favor stable middle digits deterministically (4,5,6)
    const stableDigits = [4, 5, 6];
    const recent = ticks.slice(-20).map(t => t.digit);
    const counts = new Array(10).fill(0);
    recent.forEach(d => counts[d]++);
    const predictedDigit = stableDigits.reduce((best, d) => (counts[d] > counts[best] ? d : best), stableDigits[0]);
    return {
      predictedDigit,
      confidence: 0.7,
      reason: 'Low volatility favors stable digits'
    };
  }
  
  return { predictedDigit: null, confidence: 0, reason: 'Normal volatility' };
};

// 5. RSI Strategy
export const rsiStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 20) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const rsi = calculateRSI(ticks);
  let predictedDigit: number | null = null;
  
  if (rsi > 60) {
    // Overbought - favor higher digits
    const recent = ticks.slice(-10).map(t => t.digit).filter(d => d >= 6);
    if (recent.length > 0) {
      predictedDigit = recent[recent.length - 1];
    } else {
      predictedDigit = 7;
    }
  } else if (rsi < 40) {
    // Oversold - favor lower digits
    const recent = ticks.slice(-10).map(t => t.digit).filter(d => d <= 4);
    if (recent.length > 0) {
      predictedDigit = recent[recent.length - 1];
    } else {
      predictedDigit = 3;
    }
  } else {
    // Neutral - favor middle digits
    predictedDigit = 5;
  }
  
  return {
    predictedDigit,
    confidence: 0.65,
    reason: `RSI ${rsi.toFixed(1)} suggests digit ${predictedDigit}`
  };
};

// 6. MACD Crossover Strategy
export const macdStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 30) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const { macd, signal, histogram } = calculateMACD(ticks);
  
  if (histogram > 0) {
    // Bullish - favor higher digits
    const recent = ticks.slice(-5).map(t => t.digit).filter(d => d >= 5);
    const predictedDigit = recent.length > 0 ? recent[recent.length - 1] : 7;
    return {
      predictedDigit,
      confidence: 0.6,
      reason: 'MACD bullish crossover'
    };
  } else if (histogram < 0) {
    // Bearish - favor lower digits
    const recent = ticks.slice(-5).map(t => t.digit).filter(d => d <= 5);
    const predictedDigit = recent.length > 0 ? recent[recent.length - 1] : 3;
    return {
      predictedDigit,
      confidence: 0.6,
      reason: 'MACD bearish crossover'
    };
  }
  
  return { predictedDigit: null, confidence: 0, reason: 'MACD neutral' };
};

// 7. EMA/SMA Crossover Strategy
export const movingAverageStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 20) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const { trend } = calculateMovingAverages(ticks);
  const recentDigits = ticks.slice(-5).map(t => t.digit);
  
  if (trend === 'up') {
    const highDigits = recentDigits.filter(d => d >= 5);
    const predictedDigit = highDigits.length > 0 ? highDigits[highDigits.length - 1] : 6;
    return { predictedDigit, confidence: 0.65, reason: 'Uptrend detected' };
  } else if (trend === 'down') {
    const lowDigits = recentDigits.filter(d => d <= 5);
    const predictedDigit = lowDigits.length > 0 ? lowDigits[lowDigits.length - 1] : 4;
    return { predictedDigit, confidence: 0.65, reason: 'Downtrend detected' };
  }
  
  return { predictedDigit: null, confidence: 0, reason: 'No clear trend' };
};

// 8. Stochastic Oscillator Strategy
export const stochasticStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 20) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const { k } = calculateStochastic(ticks);
  const recentDigits = ticks.slice(-5).map(t => t.digit);
  
  if (k > 80) {
    // Overbought - reduce extreme highs
    const filtered = recentDigits.filter(d => d <= 7);
    const predictedDigit = filtered.length > 0 ? filtered[filtered.length - 1] : 5;
    return { predictedDigit, confidence: 0.6, reason: 'Stochastic overbought' };
  } else if (k < 20) {
    // Oversold - reduce extreme lows
    const filtered = recentDigits.filter(d => d >= 3);
    const predictedDigit = filtered.length > 0 ? filtered[filtered.length - 1] : 5;
    return { predictedDigit, confidence: 0.6, reason: 'Stochastic oversold' };
  }
  
  return { predictedDigit: null, confidence: 0, reason: 'Stochastic neutral' };
};

// 9. Momentum Strategy
export const momentumStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 10) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const recent = ticks.slice(-10);
  const momentum = new Array(10).fill(0);
  
  recent.forEach((tick, idx) => {
    const weight = (idx + 1) / recent.length;
    momentum[tick.digit] += weight;
  });
  
  const maxMomentum = Math.max(...momentum);
  const digit = momentum.indexOf(maxMomentum);
  const strength = maxMomentum / momentum.reduce((a, b) => a + b, 0);
  
  return {
    predictedDigit: digit,
    confidence: Math.min(strength * 2, 0.85),
    reason: `Digit ${digit} has strong momentum`
  };
};

// 10. Tick Field Momentum (sudden changes)
export const tickFieldMomentumStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 10) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const recent = ticks.slice(-10).map(t => t.digit);
  const uniqueDigits = [...new Set(recent)];
  
  if (uniqueDigits.length <= 3) {
    // Low variety - predict most common
    const counts = new Array(10).fill(0);
    recent.forEach(d => counts[d]++);
    const predictedDigit = counts.indexOf(Math.max(...counts));
    return {
      predictedDigit,
      confidence: 0.75,
      reason: 'Low variety suggests continuation'
    };
  }
  
  return { predictedDigit: null, confidence: 0, reason: 'High variety detected' };
};

// Candlestick Strategy
export const candlestickStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 10) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const pattern = detectCandlestickPatterns(ticks);
  const recentDigits = ticks.slice(-5).map(t => t.digit);
  
  if (pattern.confidence > 0.6) {
    if (pattern.bullish) {
      // Bullish pattern - favor higher digits
      const highDigits = recentDigits.filter(d => d >= 5);
      const predictedDigit = highDigits.length > 0 ? highDigits[highDigits.length - 1] : 7;
      return {
        predictedDigit,
        confidence: pattern.confidence,
        reason: `${pattern.pattern} suggests bullish move`
      };
    } else {
      // Bearish pattern - favor lower digits
      const lowDigits = recentDigits.filter(d => d <= 5);
      const predictedDigit = lowDigits.length > 0 ? lowDigits[lowDigits.length - 1] : 3;
      return {
        predictedDigit,
        confidence: pattern.confidence,
        reason: `${pattern.pattern} suggests bearish move`
      };
    }
  }
  
  return { predictedDigit: null, confidence: 0, reason: 'No clear pattern' };
};

// Body-to-Wick Strategy
export const bodyWickStrategy = (ticks: Tick[]): StrategyResult => {
  if (ticks.length < 10) return { predictedDigit: null, confidence: 0, reason: 'Insufficient data' };
  
  const { ratio, uncertainty } = analyzeBodyWickRatio(ticks);
  const recentDigits = ticks.slice(-5).map(t => t.digit);
  
  if (uncertainty) {
    // High uncertainty - favor middle digits
    const middleDigits = recentDigits.filter(d => d >= 3 && d <= 7);
    const predictedDigit = middleDigits.length > 0 ? middleDigits[middleDigits.length - 1] : 5;
    return {
      predictedDigit,
      confidence: 0.7,
      reason: 'Market uncertainty favors middle digits'
    };
  }
  
  return { predictedDigit: null, confidence: 0, reason: 'Normal body-wick ratio' };
};

// Enhanced Consensus Engine with Candlestick Analysis
export const runConsensus = (ticks: Tick[]): { digit: number | null; confidence: number; details: any } => {
  if (ticks.length < 30) {
    return { digit: null, confidence: 0, details: [] };
  }

  // Analyze last 50 ticks but exclude most recent to avoid bias
  const contextTicks = ticks.slice(0, -1);

  const strategies = [
    { name: 'Digit Repetition', fn: digitRepetitionStrategy, weight: 1.5 },
    { name: 'Sum Division', fn: sumDivisionStrategy, weight: 0.9 },
    { name: 'Cluster', fn: clusterStrategy, weight: 1.3 },
    { name: 'Volatility', fn: volatilityAnalysisStrategy, weight: 1.2 },
    { name: 'RSI', fn: rsiStrategy, weight: 1.2 },
    { name: 'MACD', fn: macdStrategy, weight: 1.1 },
    { name: 'MA Crossover', fn: movingAverageStrategy, weight: 1.2 },
    { name: 'Stochastic', fn: stochasticStrategy, weight: 1.0 },
    { name: 'Momentum', fn: momentumStrategy, weight: 1.6 },
    { name: 'Tick Momentum', fn: tickFieldMomentumStrategy, weight: 1.1 },
    { name: 'Candlestick', fn: candlestickStrategy, weight: 1.3 },
    { name: 'Body-Wick', fn: bodyWickStrategy, weight: 1.0 }
  ];

  const results = strategies.map(s => ({ ...s, result: s.fn(contextTicks) }));
  
  // Calculate weighted scores for each digit
  const scores = new Array(10).fill(0);
  const votes = new Array(10).fill(0);
  
  results.forEach(({ result, weight }) => {
    if (result.predictedDigit !== null) {
      scores[result.predictedDigit] += result.confidence * weight;
      votes[result.predictedDigit] += 1;
    }
  });
  
  const maxScore = Math.max(...scores);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  
  if (maxScore === 0 || totalScore === 0) {
    return { digit: null, confidence: 0, details: results };
  }
  
  const predictedDigit = scores.indexOf(maxScore);
  let confidence = maxScore / totalScore;
  
  // Strong boost if 4+ strategies agree
  if (votes[predictedDigit] >= 4) {
    confidence *= 1.3;
  }
  
  // Additional boost for very strong consensus (6+ strategies)
  if (votes[predictedDigit] >= 6) {
    confidence *= 1.2;
  }
  
  // Cap confidence at 0.95
  confidence = Math.min(confidence, 0.95);
  
  // Only return prediction if confidence is reasonable
  return {
    digit: confidence > 0.4 ? predictedDigit : null,
    confidence,
    details: results
  };
};
