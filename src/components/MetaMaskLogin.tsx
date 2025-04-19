import React, { useEffect } from "react";

interface MetaMaskLoginProps {
  onConnect: (address: string) => void;
}

const MetaMaskLogin: React.FC<MetaMaskLoginProps> = ({ onConnect }) => {
  // Listen for account changes
  useEffect(() => {
    const provider = (window as any).ethereum;
    if (!provider) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        onConnect(accounts[0]);
      }
    };
    provider.on('accountsChanged', handleAccountsChanged);
    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [onConnect]);

  const connectWallet = async () => {
    try {
      const provider = (window as any).ethereum;
      if (!provider) {
        alert('MetaMask not detected!');
        return;
      }
      // Request account access
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        onConnect(accounts[0]);
      } else {
        alert('No accounts found.');
      }
    } catch (err: any) {
      alert('MetaMask connection failed: ' + (err.message || err));
    }
  };

  return (
    <button
      className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded px-6 py-3 shadow-lg hover:from-yellow-500 hover:to-orange-600 transition border-2 border-yellow-300"
      onClick={connectWallet}
    >
      Connect MetaMask
    </button>
  );
};

export default MetaMaskLogin;
