import React, { useEffect, useState } from "react";
import EmailLogin from "./EmailLogin";

interface WalletLoginProps {
  onConnect: (address: string, walletType: 'metamask' | 'phantom' | 'email' | 'other') => void;
}

// Add ethereum to the window type
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}

const WalletLogin: React.FC<WalletLoginProps> = ({ onConnect }) => {
  const [connecting, setConnecting] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  
  // Check for wallet providers - improved detection
  const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum;
  const hasPhantom = typeof window !== 'undefined' && !!window.solana?.isPhantom;

  // Listen for account changes
  useEffect(() => {
    // Listen for MetaMask account changes
    const ethereumProvider = (window as any).ethereum;
    if (ethereumProvider) {
      const handleMetaMaskAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0], 'metamask');
        }
      };
      ethereumProvider.on('accountsChanged', handleMetaMaskAccountsChanged);
      return () => {
        ethereumProvider.removeListener('accountsChanged', handleMetaMaskAccountsChanged);
      };
    }
    
    // Phantom doesn't have a standard event for account changes that we can easily listen to
    // Users will need to reconnect if they change accounts
  }, [onConnect]);

  // This is a completely rewritten MetaMask connection function that uses a different approach
  // to ensure the popup appears and connection works properly
  const connectMetaMask = async () => {
    try {
      setConnecting(true);
      console.log('Attempting to connect to MetaMask with new method...');
      
      // First check if MetaMask is installed
      if (typeof window === 'undefined' || !window.ethereum) {
        console.error('MetaMask not installed');
        alert('MetaMask is not installed! Please install MetaMask to continue.');
        setConnecting(false);
        return;
      }

      // Force the browser to focus on the MetaMask popup
      window.focus();
      
      // Use a different approach to request accounts
      console.log('Using alternative method to request accounts...');
      
      // Create a promise that will resolve when accounts are available
      const getAccounts = async () => {
        try {
          // This should trigger the MetaMask popup
          console.log('Sending eth_requestAccounts request...');
          return await window.ethereum.request({
            method: 'eth_requestAccounts',
            params: []
          });
        } catch (error) {
          console.error('Error in eth_requestAccounts:', error);
          throw error;
        }
      };
      
      // Execute the request with a timeout to ensure UI updates
      const accounts = await Promise.race([
        getAccounts(),
        new Promise(resolve => setTimeout(() => resolve([]), 30000)) // 30 second timeout
      ]);
      
      console.log('Accounts received:', accounts);
      
      if (Array.isArray(accounts) && accounts.length > 0) {
        const formattedAddress = accounts[0].toLowerCase();
        console.log('Successfully connected with MetaMask address:', formattedAddress);
        onConnect(formattedAddress, 'metamask');
      } else {
        console.warn('No accounts received from MetaMask');
        alert('No accounts found or access denied. Please unlock your MetaMask wallet and try again.');
      }
    } catch (err: any) {
      console.error('MetaMask connection error:', err);
      alert('Error connecting to MetaMask: ' + (err.message || 'Unknown error'));
    } finally {
      setConnecting(false);
    }
  };

  const connectPhantom = async () => {
    try {
      setConnecting(true);
      const provider = (window as any).solana;
      if (!provider?.isPhantom) {
        alert('Phantom wallet not detected!');
        setConnecting(false);
        return;
      }
      // Connect to Phantom
      const response = await provider.connect();
      const address = response.publicKey.toString();
      onConnect(address, 'phantom');
      setConnecting(false);
    } catch (err: any) {
      alert('Phantom connection failed: ' + (err.message || err));
      setConnecting(false);
    }
  };

  // Handle email login
  const handleEmailLogin = (email: string) => {
    // Generate a consistent ID from the email address
    const emailId = `email:${email}`;
    onConnect(emailId, 'email');
    setShowEmailLogin(false);
  };

  // If showing email login form
  if (showEmailLogin) {
    return (
      <EmailLogin 
        onLogin={handleEmailLogin} 
        onCancel={() => setShowEmailLogin(false)} 
      />
    );
  }

  // Default wallet selection screen
  return (
    <div className="flex flex-col space-y-4 items-center">
      <h2 className="text-xl text-white mb-2">Choose Your Login Method</h2>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          className="w-64 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-full mb-4 flex items-center justify-center"
          onClick={connectMetaMask}
          disabled={connecting || !hasMetaMask}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path d="M21.3135 2L12.8173 8.10856L14.2756 4.59317L21.3135 2Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.68652 2L11.0951 8.1668L9.72477 4.59317L2.68652 2Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.3567 16.9679L16.166 20.4451L20.6906 21.7508L21.9909 17.0427L18.3567 16.9679Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.0177 17.0427L3.30948 21.7508L7.83397 20.4451L5.65187 16.9679L2.0177 17.0427Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.57323 11.218L6.34784 13.2811L10.8259 13.508L10.6756 8.62195L7.57323 11.218Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.4274 11.2179L13.2826 8.5639L13.1748 13.508L17.6522 13.281L16.4274 11.2179Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.83398 20.4451L10.5381 19.0278L8.20252 17.0762L7.83398 20.4451Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.4619 19.0278L16.1659 20.4451L15.7975 17.0762L13.4619 19.0278Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {connecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
        <button
          className="w-64 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-full mb-4 flex items-center justify-center"
          onClick={connectPhantom}
          disabled={connecting || !hasPhantom}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#AB9FF2"/>
            <path d="M12 7L16 12L12 17L8 12L12 7Z" fill="#AB9FF2"/>
          </svg>
          {connecting ? 'Connecting...' : 'Connect Phantom'}
        </button>
        <button
          className="w-64 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full mb-4 flex items-center justify-center"
          onClick={() => setShowEmailLogin(true)}
          disabled={connecting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Login with Email
        </button>
      </div>
      {!hasMetaMask && !hasPhantom && (
        <p className="text-gray-400 mt-2">Wallet extensions not detected. You can still use email login.</p>
      )}
    </div>
  );
};

export default WalletLogin;
