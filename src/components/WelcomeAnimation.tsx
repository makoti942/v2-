import { useState, useEffect } from 'react';

const hackingMessages = [
  'Initiating connection to neural network...',
  'Bypassing mainframe security...',
  'Decrypting quantum-encrypted data streams...',
  'Accessing market sentiment matrix...',
  'Compiling predictive algorithms...',
  'Connection established.',
];

const WelcomeAnimation = ({ onAnimationEnd }: { onAnimationEnd: () => void }) => {
  const [message, setMessage] = useState(hackingMessages[0]);
  const [index, setIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (index < hackingMessages.length) {
      const timer = setTimeout(() => {
        setIndex(prevIndex => prevIndex + 1);
        setMessage(hackingMessages[index]);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      // All "hacking" messages are done, show final welcome
      setMessage('Welcome to Makoti Predictor');
      
      const welcomeTimer = setTimeout(() => {
          setMessage('Your trusted third-party website.');
      }, 1500)

      const fadeOutTimer = setTimeout(() => {
        setFadingOut(true);
      }, 3000);

      const animationEndTimer = setTimeout(() => {
        onAnimationEnd();
      }, 4000);

      return () => {
          clearTimeout(welcomeTimer);
          clearTimeout(fadeOutTimer);
          clearTimeout(animationEndTimer);
      }
    }
  }, [index, onAnimationEnd]);

  return (
    <div 
      className={`fixed inset-0 bg-background flex items-center justify-center z-50 ${
        fadingOut ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}>
      <div className="text-center p-8">
        <p className="text-2xl text-primary glow mono">
          {message}<span className="animate-pulse">_</span>
        </p>
      </div>
    </div>
  );
};

export default WelcomeAnimation;
