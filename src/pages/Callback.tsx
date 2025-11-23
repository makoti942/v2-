import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { DerivAccount } from '@/contexts/AuthContext';

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState('Processing OAuth response...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract all account tokens from URL parameters
        const accounts: DerivAccount[] = [];
        let index = 1;
        
        while (searchParams.has(`acct${index}`)) {
          const loginid = searchParams.get(`acct${index}`);
          const token = searchParams.get(`token${index}`);
          const currency = searchParams.get(`cur${index}`) || 'USD';
          
          if (loginid && token) {
            // Determine if it's a demo or real account
            const isDemoAccount = loginid.startsWith('VRT') || loginid.startsWith('vrt');
            
            accounts.push({
              loginid,
              token,
              currency: currency.toUpperCase(),
              type: isDemoAccount ? 'demo' : 'real'
            });
          }
          index++;
        }

        if (accounts.length === 0) {
          throw new Error('No valid accounts found in OAuth response');
        }

        setStatus(`Found ${accounts.length} account(s). Authorizing...`);

        // Authorize the first account to verify connection
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=109236');
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Authorization timeout'));
          }, 10000);

          ws.onopen = () => {
            ws.send(JSON.stringify({
              authorize: accounts[0].token
            }));
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.error) {
              clearTimeout(timeout);
              ws.close();
              reject(new Error(data.error.message));
              return;
            }

            if (data.authorize) {
              clearTimeout(timeout);
              ws.close();
              resolve(data.authorize);
            }
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            ws.close();
            reject(new Error('WebSocket connection failed'));
          };
        });

        // Login successful
        login(accounts);
        
        toast({
          title: 'Login Successful',
          description: `Connected with ${accounts.length} account(s)`
        });
        
        navigate('/dashboard');
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        
        toast({
          title: 'Login Failed',
          description: error instanceof Error ? error.message : 'Authentication failed',
          variant: 'destructive'
        });
        
        navigate('/login');
      }
    };

    processCallback();
  }, [searchParams, login, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl mono font-bold text-primary animate-pulse-glow">
          ...
        </div>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default Callback;
