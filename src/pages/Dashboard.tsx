import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDerivAuth } from '@/hooks/useDerivAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InstallPrompt } from '@/components/InstallPrompt';
import MakotiPredictor from '@/components/MakotiPredictor';
import BotBuilder from '@/components/BotBuilder';
import { BlocklyBotBuilder } from '@/components/BlocklyBotBuilder';
import { OtherMarketsTab } from '@/components/OtherMarketsTab';

const Dashboard = () => {
  const { user, logout, switchAccount, resetBalance } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('predictor');
  
  // Connect to Deriv API and get balance
  useDerivAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const demoAccounts = user.accounts.filter(acc => acc.type === 'demo');
  const realAccounts = user.accounts.filter(acc => acc.type === 'real');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/candle-icon-512.png" alt="Makoti" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-primary glow mono">
              MAKOTI PREDICTOR
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Account Switcher */}
            <div className="flex gap-2">
              {demoAccounts.length > 0 && (
                <Button
                  variant={user.activeAccount.type === 'demo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchAccount(demoAccounts[0].loginid)}
                >
                  Demo
                </Button>
              )}
              {realAccounts.length > 0 && (
                <Button
                  variant={user.activeAccount.type === 'real' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchAccount(realAccounts[0].loginid)}
                >
                  Real
                </Button>
              )}
            </div>
            
            {/* Balance */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {user.activeAccount.type.toUpperCase()} - {user.activeAccount.loginid}
                </div>
                <div className="text-lg font-bold mono text-accent">
                  {user.balance.toFixed(2)} {user.activeAccount.currency}
                </div>
              </div>
              {user.activeAccount.type === 'demo' && (
                <Button variant="outline" size="sm" onClick={resetBalance}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to $10,000
                </Button>
              )}
            </div>
            
            {/* Logout */}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4 mb-6">
            <TabsTrigger value="predictor">Predictor</TabsTrigger>
            <TabsTrigger value="bot">Simple Bot</TabsTrigger>
            <TabsTrigger value="blockly-bot">Blockly Bot</TabsTrigger>
            <TabsTrigger value="other-markets">Other Markets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="predictor">
            <MakotiPredictor />
          </TabsContent>
          
          <TabsContent value="bot">
            <BotBuilder />
          </TabsContent>
          
          <TabsContent value="blockly-bot">
            <BlocklyBotBuilder />
          </TabsContent>
          
          <TabsContent value="other-markets">
            <OtherMarketsTab />
          </TabsContent>
        </Tabs>
      </div>

      <InstallPrompt />
    </div>
  );
};

export default Dashboard;
