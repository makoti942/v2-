import { useState, useEffect, useRef } from "react";

export interface Tick {
  digit: number;
  quote: number;
  timestamp: number;
}

export const useDerivWebSocket = (symbol: string) => {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<Tick[]>([]);

  useEffect(() => {
    if (!symbol) return;

    let ws: WebSocket | null = null;

    bufferRef.current = [];
    setTicks([]);

    const connect = () => {
      // FIX: Use correct endpoint for free/public app_id (109236)
      ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=109236");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Deriv WS connected");
        setIsConnected(true);

        // Load history
        ws!.send(
          JSON.stringify({
            ticks_history: symbol,
            count: 50,
            end: "latest",
            style: "ticks",
          })
        );

        // Subscribe to live ticks
        ws!.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.history) {
          const historyTicks = data.history.prices.map(
            (p: number, i: number) => {
              const digit = parseInt(p.toString().slice(-1), 10);
              return {
                digit: isNaN(digit) ? 0 : digit,
                quote: Number(p),
                timestamp: Number(data.history.times[i]) * 1000,
              } as Tick;
            }
          );

          bufferRef.current = historyTicks.slice(-50);
          setTicks([...bufferRef.current]);
        }

        if (data.tick) {
          const quote = Number(data.tick.quote);
          const digit = parseInt(quote.toString().slice(-1), 10);

          bufferRef.current = [
            ...bufferRef.current,
            {
              digit: isNaN(digit) ? 0 : digit,
              quote,
              timestamp: Date.now(),
            },
          ].slice(-50);

          setTicks([...bufferRef.current]);
        }

        if (data.error) {
          console.error("Deriv Error:", data.error);
        }
      };

      ws.onerror = () => setIsConnected(false);

      ws.onclose = () => {
        setIsConnected(false);
        console.log("WS closed, reconnecting…");
        setTimeout(connect, 1200);
      };
    };

    connect();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [symbol]);

  return { ticks, isConnected };
};
