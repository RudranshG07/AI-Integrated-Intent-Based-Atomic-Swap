import React, { useState, useEffect } from 'react';
import { web3Service } from '../services/web3';
import { WalletState } from '../types';
import { NETWORKS } from '../config/networks';
import { Wallet, ChevronDown } from 'lucide-react';

interface WalletConnectorProps {
  onWalletStateChange: (state: WalletState) => void;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({ onWalletStateChange }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    account: null,
    chainId: null,
    provider: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  useEffect(() => {
    onWalletStateChange(walletState);
  }, [walletState, onWalletStateChange]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const state = await web3Service.connectWallet();
          setWalletState(state);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setWalletState({
        connected: false,
        account: null,
        chainId: null,
        provider: null
      });
    } else {
      checkWalletConnection();
    }
  };

  const handleChainChanged = () => {
    checkWalletConnection();
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      const state = await web3Service.connectWallet();
      setWalletState(state);
    } catch (error: any) {
      alert(`Error connecting wallet: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const switchNetwork = async (networkKey: string) => {
    try {
      await web3Service.switchNetwork(networkKey);
    } catch (error: any) {
      alert(`Error switching network: ${error.message}`);
    }
  };

  const getCurrentNetwork = () => {
    if (!walletState.chainId) return null;
    return Object.entries(NETWORKS).find(([, network]) => network.chainId === walletState.chainId)?.[1];
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const currentNetwork = getCurrentNetwork();

  if (!walletState.connected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <Wallet className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-4">
            Connect your MetaMask wallet to start using atomic swaps
          </p>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Wallet className="text-green-600" size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              {walletState.account ? formatAddress(walletState.account) : 'Connected'}
            </div>
            <div className="text-sm text-gray-600">
              {currentNetwork ? currentNetwork.name : 'Unknown Network'}
            </div>
          </div>
        </div>
        
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200">
            <span className="text-sm">Switch Network</span>
            <ChevronDown size={16} />
          </button>
          
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            {Object.entries(NETWORKS).map(([key, network]) => (
              <button
                key={key}
                onClick={() => switchNetwork(key)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                  network.chainId === walletState.chainId ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <div className="font-medium">{network.name}</div>
                <div className="text-xs text-gray-500">{network.nativeCurrency.symbol}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};