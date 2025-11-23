import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useDerivAuth = () => {
  const { user, updateBalance } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    // Don't create a new connection if one already exists and is open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=109236');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Deriv API');
      
      // Authorize with active account token
      ws.send(JSON.stringify({
        authorize: user.activeAccount.token
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.authorize) {
        console.log('Authorization successful:', data.authorize);
        updateBalance(data.authorize.balance || 0);
        
        // Subscribe to balance updates
        ws.send(JSON.stringify({
          balance: 1,
          subscribe: 1
        }));
      }
      
      if (data.balance) {
        updateBalance(data.balance.balance);
      }
      
      if (data.error) {
        console.error('Deriv API error:', data.error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from Deriv API');
    };

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Don't close the connection on cleanup, keep it alive for tab switching
    };
  }, [user?.activeAccount.token, updateBalance]);

  return { ws: wsRef.current };
};
