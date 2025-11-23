import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const APP_ID = '109236';

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const redirectUrl = `${window.location.origin}/callback`;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    const authUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=EN&brand=deriv`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 space-y-6 bg-card border-border">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/candle-icon-512.png" 
              alt="Makoti Predictor" 
              className="h-20 w-20"
            />
          </div>
          <h1 className="text-4xl font-bold text-primary glow mono">
            MAKOTI PREDICTOR
          </h1>
          <p className="text-muted-foreground">
            Advanced Trading Platform with Bot Builder
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleLogin}
            className="w-full"
            size="lg"
          >
            Login with Deriv Account
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            You'll be redirected to Deriv for secure authentication
          </p>
        </div>

      </Card>
    </div>
  );
};

export default Login;
