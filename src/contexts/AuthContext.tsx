import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface DerivAccount {
  loginid: string;
  token: string;
  currency: string;
  type: 'real' | 'demo';
}

interface AuthUser {
  accounts: DerivAccount[];
  activeAccount: DerivAccount;
  balance: number;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (accounts: DerivAccount[]) => void;
  logout: () => void;
  switchAccount: (loginid: string) => void;
  updateBalance: (balance: number) => void;
  resetBalance: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedAccounts = sessionStorage.getItem('deriv_accounts');
    const storedActiveLoginid = sessionStorage.getItem('deriv_active_account');
    
    if (storedAccounts) {
      const accounts: DerivAccount[] = JSON.parse(storedAccounts);
      const activeAccount = accounts.find(acc => acc.loginid === storedActiveLoginid) || accounts[0];
      
      setUser({
        accounts,
        activeAccount,
        balance: 0
      });
    }
  }, []);

  const login = (accounts: DerivAccount[]) => {
    if (accounts.length === 0) return;
    
    sessionStorage.setItem('deriv_accounts', JSON.stringify(accounts));
    sessionStorage.setItem('deriv_active_account', accounts[0].loginid);
    
    setUser({
      accounts,
      activeAccount: accounts[0],
      balance: 0
    });
  };

  const logout = () => {
    sessionStorage.removeItem('deriv_accounts');
    sessionStorage.removeItem('deriv_active_account');
    setUser(null);
  };

  const updateBalance = useCallback((balance: number) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      return { ...currentUser, balance };
    });
  }, []);

  const switchAccount = useCallback((loginid: string) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const newActive = currentUser.accounts.find(acc => acc.loginid === loginid);
      if (!newActive || newActive.loginid === currentUser.activeAccount.loginid) {
        return currentUser;
      }
      sessionStorage.setItem('deriv_active_account', loginid);
      
      // Fetch balance for new account immediately
      const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=109236');
      ws.onopen = () => {
        ws.send(JSON.stringify({ authorize: newActive.token }));
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.authorize) {
          updateBalance(Number(data.authorize.balance) || 0);
          ws.close();
        }
      };
      
      return { ...currentUser, activeAccount: newActive, balance: 0 };
    });
  }, [updateBalance]);

  const resetBalance = useCallback(async () => {
    if (!user || user.activeAccount.type !== 'demo') return;

    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=109236');
    
    return new Promise<void>((resolve) => {
      ws.onopen = () => {
        ws.send(JSON.stringify({ authorize: user.activeAccount.token }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.authorize) {
          // Request a virtual top-up to reset to default (e.g., 10,000)
          ws.send(JSON.stringify({ topup_virtual: 1 }));
        } else if (data.topup_virtual) {
          // After top-up, fetch the updated balance
          ws.send(JSON.stringify({ balance: 1 }));
        } else if (data.balance) {
          const balance = Number(data.balance.balance);
          updateBalance(balance);
          ws.close();
          resolve();
        }
      };

      ws.onerror = () => {
        ws.close();
        resolve();
      };
    });
  }, [user, updateBalance]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      switchAccount,
      updateBalance,
      resetBalance,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
