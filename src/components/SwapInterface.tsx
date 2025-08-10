import React, { useState } from 'react';
import { web3Service } from '../services/web3';
import { ArrowDownIcon, SettingsIcon, RefreshCwIcon } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  network: string;
  chainId: number;
  icon: string;
  color: string;
}

const TOKENS: Token[] = [
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    network: 'Fuji',
    chainId: 43113,
    icon: '🔺',
    color: '#e84142'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Sepolia',
    chainId: 11155111,
    icon: '🔷',
    color: '#627eea'
  }
];

type SwapStep = 'input' | 'review' | 'pending' | 'complete';

export const SwapInterface: React.FC = () => {
  const [fromToken, setFromToken] = useState<Token>(TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapStep, setSwapStep] = useState<SwapStep>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [secret, setSecret] = useState<{ secret: string; hash: string } | null>(null);
  const [contractIds, setContractIds] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [walletAddress, setWalletAddress] = useState('');
  const [progress, setProgress] = useState(0);

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const wallet = await web3Service.connectWallet();
      setWalletAddress(wallet.account || '');
      setSuccess('Wallet connected successfully!');
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleAmountChange = (value: string, isFrom: boolean) => {
    if (isFrom) {
      setFromAmount(value);
      // Simple 1:0.5 ratio for demo
      setToAmount(value ? (parseFloat(value) * 0.5).toString() : '');
    } else {
      setToAmount(value);
      setFromAmount(value ? (parseFloat(value) * 2).toString() : '');
    }
  };

  const generateSecret = () => {
    try {
      const secretData = web3Service.generateSecret();
      setSecret(secretData);
      setProgress(25);
    } catch (err: any) {
      setError('Failed to generate secret: ' + err.message);
    }
  };

  const createFirstSwap = async () => {
    if (!secret || !fromAmount || !walletAddress) return;
    
    try {
      setLoading(true);
      setSwapStep('pending');
      
      await web3Service.switchNetwork(fromToken.network.toLowerCase());
      
      const contractId = await web3Service.createSwap({
        participant: walletAddress,
        amount: fromAmount,
        hashLock: secret.hash,
        timelock: 3600,
        network: fromToken.network.toLowerCase()
      });
      
      setContractIds(prev => ({ ...prev, from: contractId }));
      setProgress(50);
      setSuccess(`First swap created! Contract: ${contractId.slice(0, 10)}...`);
    } catch (err: any) {
      setError(err.message);
      setSwapStep('input');
    } finally {
      setLoading(false);
    }
  };

  const createSecondSwap = async () => {
    if (!secret || !toAmount || !walletAddress) return;
    
    try {
      setLoading(true);
      
      await web3Service.switchNetwork(toToken.network.toLowerCase());
      
      const contractId = await web3Service.createSwap({
        participant: walletAddress,
        amount: toAmount,
        hashLock: secret.hash,
        timelock: 1800,
        network: toToken.network.toLowerCase()
      });
      
      setContractIds(prev => ({ ...prev, to: contractId }));
      setProgress(75);
      setSuccess(`Second swap created! Contract: ${contractId.slice(0, 10)}...`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!secret || !contractIds.from || !contractIds.to) return;
    
    try {
      setLoading(true);
      
      // Claim first swap
      await web3Service.switchNetwork(toToken.network.toLowerCase());
      await web3Service.claimSwap({
        contractId: contractIds.from,
        preimage: secret.secret,
        network: toToken.network.toLowerCase()
      });
      
      // Claim second swap  
      await web3Service.switchNetwork(fromToken.network.toLowerCase());
      await web3Service.claimSwap({
        contractId: contractIds.to,
        preimage: secret.secret,
        network: fromToken.network.toLowerCase()
      });
      
      setProgress(100);
      setSwapStep('complete');
      setSuccess(`🎉 Atomic swap completed! You swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSwap = () => {
    setSwapStep('input');
    setProgress(0);
    setSecret(null);
    setContractIds({ from: '', to: '' });
    setFromAmount('');
    setToAmount('');
    setError('');
    setSuccess('');
  };

  const getStepTitle = () => {
    switch (swapStep) {
      case 'input': return 'Atomic Swap';
      case 'review': return 'Review Swap';
      case 'pending': return 'Creating Swaps...';
      case 'complete': return 'Swap Complete!';
    }
  };

  const getActionButton = () => {
    if (!walletAddress) {
      return (
        <button onClick={handleConnectWallet} className="btn-primary w-full" disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      );
    }

    switch (swapStep) {
      case 'input':
        if (!fromAmount || !toAmount) {
          return <button className="btn-primary w-full opacity-50" disabled>Enter Amount</button>;
        }
        if (!secret) {
          return (
            <button onClick={generateSecret} className="btn-primary w-full">
              Generate Secret & Review
            </button>
          );
        }
        return (
          <button onClick={() => setSwapStep('review')} className="btn-primary w-full">
            Review Swap
          </button>
        );
        
      case 'review':
        return (
          <button onClick={createFirstSwap} className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create First Swap'}
          </button>
        );
        
      case 'pending':
        if (!contractIds.from) {
          return <button className="btn-primary w-full opacity-50" disabled>Creating First Swap...</button>;
        }
        if (!contractIds.to) {
          return (
            <button onClick={createSecondSwap} className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Second Swap'}
            </button>
          );
        }
        return (
          <button onClick={executeSwap} className="btn-primary w-full" disabled={loading}>
            {loading ? 'Executing...' : 'Execute Atomic Swap!'}
          </button>
        );
        
      case 'complete':
        return (
          <button onClick={resetSwap} className="btn-secondary w-full">
            Start New Swap
          </button>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="swap-card w-full max-w-md p-6 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{getStepTitle()}</h1>
          <div className="flex items-center gap-2">
            {walletAddress && (
              <div className="network-indicator">
                <div className="network-dot"></div>
                <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </div>
            )}
            <button className="btn-secondary p-2">
              <SettingsIcon size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="mb-6">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">{progress}% Complete</p>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="error-message mb-4 fade-in">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message mb-4 fade-in">
            {success}
          </div>
        )}

        {/* Swap Interface */}
        <div className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">From</span>
              <span className="text-sm text-gray-500">Balance: --</span>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleAmountChange(e.target.value, true)}
                className="swap-input w-full pr-24"
                disabled={swapStep !== 'input'}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="token-display">
                  <span className="token-icon">{fromToken.icon}</span>
                  <span>{fromToken.symbol}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{fromToken.name}</span>
              <span>{fromToken.network}</span>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <button 
              className="swap-arrow"
              onClick={switchTokens}
              disabled={swapStep !== 'input'}
            >
              <ArrowDownIcon size={20} />
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">To</span>
              <span className="text-sm text-gray-500">Balance: --</span>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="0.0"
                value={toAmount}
                onChange={(e) => handleAmountChange(e.target.value, false)}
                className="swap-input w-full pr-24"
                disabled={swapStep !== 'input'}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="token-display">
                  <span className="token-icon">{toToken.icon}</span>
                  <span>{toToken.symbol}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{toToken.name}</span>
              <span>{toToken.network}</span>
            </div>
          </div>
        </div>

        {/* Secret Display */}
        {secret && swapStep === 'input' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-12px">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-800">Secret Generated</span>
              <span className="text-xs text-yellow-600">Keep Safe!</span>
            </div>
            <div className="text-xs font-mono text-yellow-700 break-all">
              {secret.secret}
            </div>
          </div>
        )}

        {/* Contract IDs Display */}
        {(contractIds.from || contractIds.to) && (
          <div className="mt-4 space-y-2">
            {contractIds.from && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">From Contract:</span> {contractIds.from.slice(0, 10)}...
              </div>
            )}
            {contractIds.to && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">To Contract:</span> {contractIds.to.slice(0, 10)}...
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          {getActionButton()}
        </div>

        {/* Info Section */}
        {swapStep === 'input' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-12px">
            <h3 className="text-sm font-medium text-blue-800 mb-2">How it works:</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>1. Generate a secret key (keeps swap secure)</li>
              <li>2. Lock your {fromToken.symbol} on {fromToken.network}</li>
              <li>3. Lock equivalent {toToken.symbol} on {toToken.network}</li>
              <li>4. Execute atomic swap to complete trade</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};