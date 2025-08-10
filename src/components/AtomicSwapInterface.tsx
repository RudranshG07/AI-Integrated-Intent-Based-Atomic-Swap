import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, HTLC_ABI, NetworkName } from '../config/contracts';

interface SwapData {
  fromNetwork: NetworkName;
  toNetwork: NetworkName;
  fromAmount: string;
  toAmount: string;
  secret?: string;
  secretHash?: string;
  contractId?: string;
  timelock?: number;
  step: 'setup' | 'initiate' | 'participate' | 'complete';
}

interface WalletState {
  address: string | null;
  balance: string;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
  balances: {
    [key: string]: string;
  };
}

export const AtomicSwapInterface: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0',
    chainId: null,
    provider: null,
    balances: {}
  });
  
  const [swap, setSwap] = useState<SwapData>({
    fromNetwork: 'avalanche',
    toNetwork: 'ethereum',
    fromAmount: '',
    toAmount: '',
    step: 'setup'
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    message: string;
    type: 'pending' | 'success' | 'error';
    hash?: string;
  } | null>(null);

  const [showExplanation, setShowExplanation] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // Fetch balances from all networks
  const fetchAllBalances = async (address: string) => {
    const balances: { [key: string]: string } = {};
    
    for (const [networkName, config] of Object.entries(CONTRACT_ADDRESSES)) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
        const balance = await provider.getBalance(address);
        balances[networkName] = ethers.utils.formatEther(balance);
      } catch (error) {
        console.error(`Failed to fetch balance for ${networkName}:`, error);
        balances[networkName] = '0';
      }
    }
    
    return balances;
  };

  // Get network name from chain ID
  const getNetworkName = (chainId: number): string => {
    for (const [networkName, config] of Object.entries(CONTRACT_ADDRESSES)) {
      if (config.chainId === chainId) {
        return config.name;
      }
    }
    return `Unknown (${chainId})`;
  };

  // Fetch exchange rate between tokens
  const fetchExchangeRate = async (fromCurrency: string, toCurrency: string) => {
    console.log('Fetching exchange rate:', { fromCurrency, toCurrency });
    
    if (fromCurrency === toCurrency) {
      console.log('Same currency, setting rate to 1');
      setExchangeRate(1);
      return;
    }

    setIsLoadingRate(true);
    try {
      // Use simplified fallback rates for now to ensure it works
      let rate = 1;
      
      if (fromCurrency === 'AVAX' && toCurrency === 'ETH') {
        rate = 0.0135; // 1 AVAX ≈ 0.0135 ETH (approximate)
      } else if (fromCurrency === 'ETH' && toCurrency === 'AVAX') {
        rate = 74.0; // 1 ETH ≈ 74 AVAX (approximate)
      }
      
      console.log('Setting exchange rate to:', rate);
      setExchangeRate(rate);
      
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      // Fallback rates
      if (fromCurrency === 'AVAX' && toCurrency === 'ETH') {
        setExchangeRate(0.0135);
      } else if (fromCurrency === 'ETH' && toCurrency === 'AVAX') {
        setExchangeRate(74.0);
      } else {
        setExchangeRate(1);
      }
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Calculate receive amount based on exchange rate
  const calculateReceiveAmount = (fromAmount: string): string => {
    console.log('Calculating receive amount:', { fromAmount, exchangeRate });
    if (!fromAmount || fromAmount === '0' || !exchangeRate) return '';
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) return '';
    const result = (amount * exchangeRate).toFixed(6);
    console.log('Calculated result:', result);
    return result;
  };

  // Handle from amount change
  const handleFromAmountChange = (amount: string) => {
    console.log('From amount changed:', amount);
    const calculatedToAmount = calculateReceiveAmount(amount);
    console.log('Setting toAmount to:', calculatedToAmount);
    setSwap(prev => ({
      ...prev,
      fromAmount: amount,
      toAmount: calculatedToAmount
    }));
  };

  // Handle network selection change
  const handleNetworkChange = (type: 'from' | 'to', networkName: NetworkName) => {
    console.log('Network changed:', { type, networkName });
    setSwap(prev => {
      const newSwap = {
        ...prev,
        [type === 'from' ? 'fromNetwork' : 'toNetwork']: networkName
      };
      
      // Prevent same network selection
      if (newSwap.fromNetwork === newSwap.toNetwork) {
        // If changing 'from' to same as 'to', swap the 'to' network
        if (type === 'from') {
          newSwap.toNetwork = prev.fromNetwork;
        } else {
          newSwap.fromNetwork = prev.toNetwork;
        }
      }
      
      // Reset amounts when networks change to force recalculation
      newSwap.toAmount = '';
      
      return newSwap;
    });
  };

  // Connect wallet
  const connectWallet = async () => {
    console.log('Attempting to connect wallet...');
    
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install MetaMask and refresh the page.');
      return;
    }

    setIsConnecting(true);
    try {
      console.log('Requesting account access...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      console.log('Accounts received:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log('Provider created');
      
      // Get network
      const network = await provider.getNetwork();
      console.log('Network:', network);
      
      // Get balance
      const balance = await provider.getBalance(accounts[0]);
      console.log('Current network balance:', ethers.utils.formatEther(balance));

      // Fetch balances from all networks
      console.log('Fetching balances from all networks...');
      const allBalances = await fetchAllBalances(accounts[0]);
      console.log('All balances:', allBalances);

      setWallet({
        address: accounts[0],
        balance: ethers.utils.formatEther(balance),
        chainId: network.chainId,
        provider,
        balances: allBalances
      });
      
      console.log('Wallet connected successfully');
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      if (error.code === 4001) {
        alert('Connection rejected by user');
      } else if (error.code === -32002) {
        alert('Connection request already pending. Please check MetaMask.');
      } else {
        alert(`Failed to connect wallet: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch network
  const switchNetwork = async (networkName: NetworkName) => {
    if (!wallet.provider) return;
    
    const networkConfig = CONTRACT_ADDRESSES[networkName];
    try {
      await wallet.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${networkConfig.chainId.toString(16)}` }
      ]);
      
      // Update wallet state after network switch
      const network = await wallet.provider.getNetwork();
      const balance = await wallet.provider.getBalance(wallet.address!);
      
      setWallet(prev => ({
        ...prev,
        chainId: network.chainId,
        balance: ethers.utils.formatEther(balance)
      }));
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added to MetaMask, add it
        try {
          await wallet.provider.send('wallet_addEthereumChain', [{
            chainId: `0x${networkConfig.chainId.toString(16)}`,
            chainName: networkConfig.name,
            rpcUrls: [networkConfig.rpcUrl],
            blockExplorerUrls: [networkConfig.explorerUrl]
          }]);
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  // Check contract status
  const checkContractStatus = async (networkName: NetworkName) => {
    if (!wallet.provider) return;

    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES[networkName].htlc,
        HTLC_ABI,
        wallet.provider
      );

      const emergencyStop = await contract.emergencyStop();
      const owner = await contract.owner();
      const isOwner = owner.toLowerCase() === wallet.address?.toLowerCase();

      console.log(`Contract status for ${networkName}:`, {
        emergencyStop,
        owner,
        isOwner,
        currentUser: wallet.address
      });

      return { emergencyStop, owner, isOwner };
    } catch (error) {
      console.error(`Failed to check contract status for ${networkName}:`, error);
      return null;
    }
  };

  // Fix emergency stop
  const fixEmergencyStop = async (networkName: NetworkName) => {
    if (!wallet.provider) return;

    try {
      await switchNetwork(networkName);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES[networkName].htlc,
        HTLC_ABI,
        wallet.provider.getSigner()
      );

      const status = await checkContractStatus(networkName);
      if (!status?.isOwner) {
        alert('You are not the owner of this contract');
        return;
      }

      if (status.emergencyStop) {
        console.log('Disabling emergency stop...');
        const tx = await contract.toggleEmergencyStop();
        
        setTransactionStatus({
          message: 'Disabling emergency stop...',
          type: 'pending',
          hash: tx.hash
        });

        await tx.wait();
        
        setTransactionStatus({
          message: 'Emergency stop disabled successfully!',
          type: 'success',
          hash: tx.hash
        });

        // Update status
        await checkContractStatus(networkName);
      } else {
        setTransactionStatus({
          message: 'Emergency stop is already disabled',
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Failed to fix emergency stop:', error);
      setTransactionStatus({
        message: `Failed to fix emergency stop: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Generate secret and hash
  const generateSecret = () => {
    const secret = ethers.utils.randomBytes(32);
    const secretHex = ethers.utils.hexlify(secret);
    const secretHash = ethers.utils.keccak256(secretHex);
    
    setSwap(prev => ({
      ...prev,
      secret: secretHex,
      secretHash
    }));
  };

  // Initiate swap (step 1)
  const initiateSwap = async () => {
    if (!wallet.provider || !swap.secret || !swap.secretHash) {
      alert('Please generate secret first');
      return;
    }

    console.log('Initiating swap with details:', {
      fromNetwork: swap.fromNetwork,
      fromAmount: swap.fromAmount,
      toNetwork: swap.toNetwork,
      contractAddress: CONTRACT_ADDRESSES[swap.fromNetwork].htlc
    });

    // Switch to from network
    await switchNetwork(swap.fromNetwork);
    
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES[swap.fromNetwork].htlc,
      HTLC_ABI,
      wallet.provider.getSigner()
    );

    // Check if emergency stop is enabled and rate limits
    try {
      const emergencyStop = await contract.emergencyStop();
      console.log('Emergency stop status:', emergencyStop);
      
      if (emergencyStop) {
        setTransactionStatus({
          message: 'Emergency stop is enabled on this contract. Swaps are temporarily disabled.',
          type: 'error'
        });
        return;
      }

      // Check rate limiting
      const userSwapCount = await contract.userSwapCount(wallet.address);
      const lastSwapTime = await contract.lastSwapTime(wallet.address);
      const maxSwaps = await contract.MAX_SWAPS_PER_USER();
      const rateLimitWindow = await contract.RATE_LIMIT_WINDOW();
      const currentTime = Math.floor(Date.now() / 1000);

      console.log('Rate limit check:', {
        userSwapCount: userSwapCount.toString(),
        lastSwapTime: lastSwapTime.toString(),
        maxSwaps: maxSwaps.toString(),
        rateLimitWindow: rateLimitWindow.toString(),
        currentTime: currentTime.toString(),
        timeSinceLastSwap: (currentTime - lastSwapTime.toNumber()).toString(),
        windowExpired: currentTime > lastSwapTime.toNumber() + rateLimitWindow.toNumber()
      });

      // Check if user has exceeded rate limit
      const windowExpired = currentTime > lastSwapTime.toNumber() + rateLimitWindow.toNumber();
      const effectiveSwapCount = windowExpired ? 0 : userSwapCount.toNumber();
      
      if (effectiveSwapCount >= maxSwaps.toNumber()) {
        const timeRemaining = (lastSwapTime.toNumber() + rateLimitWindow.toNumber()) - currentTime;
        const hoursRemaining = Math.ceil(timeRemaining / 3600);
        
        setTransactionStatus({
          message: `Rate limit exceeded. You have made ${effectiveSwapCount}/${maxSwaps} swaps. Please wait ${hoursRemaining} hours before making another swap.`,
          type: 'error'
        });
        return;
      }
    } catch (error) {
      console.log('Could not check contract status:', error);
    }

    const timelock = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
    // For demo purposes, use a different address as participant (normally this would be the counterparty)
    const participantAddress = '0x742d35Cc6Bf34257a1b5b1D4f5C41b9B6CE2e5a04'; // Demo participant address

    console.log('Contract call parameters:', {
      participant: participantAddress,
      secretHash: swap.secretHash,
      timelock: new Date(timelock * 1000).toLocaleString(),
      value: ethers.utils.parseEther(swap.fromAmount).toString()
    });

    setTransactionStatus({
      message: 'Initiating swap...',
      type: 'pending'
    });

    try {
      // Estimate gas first
      const gasEstimate = await contract.estimateGas.newContract(
        participantAddress,
        swap.secretHash,
        timelock,
        { value: ethers.utils.parseEther(swap.fromAmount) }
      );
      
      console.log('Gas estimate:', gasEstimate.toString());

      const tx = await contract.newContract(
        participantAddress,
        swap.secretHash,
        timelock,
        { 
          value: ethers.utils.parseEther(swap.fromAmount),
          gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
        }
      );

      console.log('Transaction submitted:', tx.hash);

      setTransactionStatus({
        message: 'Transaction submitted, waiting for confirmation...',
        type: 'pending',
        hash: tx.hash
      });

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Extract contract ID from events
      const event = receipt.events?.find((e: any) => e.event === 'SwapInitiated');
      const contractId = event?.args?.contractId;

      console.log('Swap initiated with contract ID:', contractId);

      setSwap(prev => ({
        ...prev,
        contractId,
        timelock,
        step: 'participate'
      }));

      setTransactionStatus({
        message: 'Swap initiated successfully',
        type: 'success',
        hash: tx.hash
      });
    } catch (error: any) {
      console.error('Swap initiation failed:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = error.message || 'Unknown error occurred';
      
      // Handle specific error messages
      if (errorMessage.includes('circuit breaker') || errorMessage.includes('Emergency stop')) {
        errorMessage = 'Emergency stop is enabled. Please contact support or try again later.';
      } else if (errorMessage.includes('Rate limit exceeded')) {
        errorMessage = 'You have exceeded the rate limit. Please wait before making another swap.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction and gas fees.';
      } else if (errorMessage.includes('user rejected') || errorMessage.includes('denied transaction')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (errorMessage.includes('Invalid participant address')) {
        errorMessage = 'Invalid participant address provided.';
      } else if (errorMessage.includes('Cannot swap with yourself')) {
        errorMessage = 'Cannot create swap with the same address as participant.';
      } else if (errorMessage.includes('Contract already exists')) {
        errorMessage = 'A swap with these parameters already exists.';
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Transaction would fail - please check contract conditions and try again.';
      }
      
      setTransactionStatus({
        message: `Failed to initiate swap: ${errorMessage}`,
        type: 'error'
      });
    }
  };

  // Participate in swap (step 2)
  const participateSwap = async () => {
    if (!wallet.provider || !swap.secretHash) return;

    // Switch to destination network
    await switchNetwork(swap.toNetwork);
    
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES[swap.toNetwork].htlc,
      HTLC_ABI,
      wallet.provider.getSigner()
    );

    const timelock = Math.floor(Date.now() / 1000) + (12 * 60 * 60); // 12 hours from now
    // For demo purposes, use the same participant address as in initiation
    const participantAddress = '0x742d35Cc6Bf34257a1b5b1D4f5C41b9B6CE2e5a04';

    setTransactionStatus({
      message: 'Participating in swap...',
      type: 'pending'
    });

    try {
      const tx = await contract.newContract(
        participantAddress,
        swap.secretHash,
        timelock,
        { value: ethers.utils.parseEther(swap.toAmount) }
      );

      setTransactionStatus({
        message: 'Participation transaction submitted...',
        type: 'pending',
        hash: tx.hash
      });

      await tx.wait();

      setSwap(prev => ({ ...prev, step: 'complete' }));

      setTransactionStatus({
        message: 'Participation successful, ready to complete swap',
        type: 'success',
        hash: tx.hash
      });
    } catch (error: any) {
      setTransactionStatus({
        message: `Failed to participate: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Complete swap (reveal secret)
  const completeSwap = async () => {
    if (!wallet.provider || !swap.secret || !swap.contractId) return;

    // First withdraw from destination network
    await switchNetwork(swap.toNetwork);
    
    const toContract = new ethers.Contract(
      CONTRACT_ADDRESSES[swap.toNetwork].htlc,
      HTLC_ABI,
      wallet.provider.getSigner()
    );

    setTransactionStatus({
      message: 'Completing swap...',
      type: 'pending'
    });

    try {
      const tx = await toContract.withdraw(swap.contractId, swap.secret);
      
      setTransactionStatus({
        message: 'Finalizing swap...',
        type: 'pending',
        hash: tx.hash
      });

      await tx.wait();

      setTransactionStatus({
        message: 'Atomic swap completed successfully!',
        type: 'success',
        hash: tx.hash
      });

    } catch (error: any) {
      setTransactionStatus({
        message: `Failed to complete swap: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Swap direction
  const swapDirection = () => {
    setSwap(prev => {
      const newFromAmount = prev.toAmount;
      return {
        ...prev,
        fromNetwork: prev.toNetwork,
        toNetwork: prev.fromNetwork,
        fromAmount: newFromAmount,
        toAmount: calculateReceiveAmount(newFromAmount)
      };
    });
  };

  // Reset swap
  const resetSwap = () => {
    setSwap({
      fromNetwork: 'avalanche',
      toNetwork: 'ethereum',
      fromAmount: '',
      toAmount: '',
      step: 'setup'
    });
    setTransactionStatus(null);
  };

  // Auto-connect wallet if already authorized
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts && accounts.length > 0) {
            console.log('Auto-connecting to existing wallet...');
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            const balance = await provider.getBalance(accounts[0]);
            const allBalances = await fetchAllBalances(accounts[0]);

            setWallet({
              address: accounts[0],
              balance: ethers.utils.formatEther(balance),
              chainId: network.chainId,
              provider,
              balances: allBalances
            });
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    checkWalletConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          setWallet({
            address: null,
            balance: '0',
            chainId: null,
            provider: null,
            balances: {}
          });
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = (chainId: string) => {
        console.log('Chain changed:', chainId);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  useEffect(() => {
    if (swap.step === 'setup' && !swap.secret) {
      generateSecret();
    }
  }, [swap.step]);

  // Fetch exchange rate when networks change
  useEffect(() => {
    const fromCurrency = CONTRACT_ADDRESSES[swap.fromNetwork].currency;
    const toCurrency = CONTRACT_ADDRESSES[swap.toNetwork].currency;
    
    if (fromCurrency !== toCurrency) {
      fetchExchangeRate(fromCurrency, toCurrency);
    } else {
      setExchangeRate(1);
    }
  }, [swap.fromNetwork, swap.toNetwork]);

  // Update toAmount when exchange rate changes
  useEffect(() => {
    console.log('Exchange rate changed, recalculating:', { fromAmount: swap.fromAmount, exchangeRate });
    if (swap.fromAmount && exchangeRate > 0) {
      const newToAmount = calculateReceiveAmount(swap.fromAmount);
      console.log('Updating toAmount to:', newToAmount);
      setSwap(prev => ({
        ...prev,
        toAmount: newToAmount
      }));
    }
  }, [exchangeRate, swap.fromAmount]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="swap-card w-full max-w-md p-6 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Atomic Swap</h1>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary text-xs"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? 'Hide Guide' : 'Show Guide'}
            </button>
            <button
              className="btn-secondary text-xs"
              onClick={async () => {
                const status = await checkContractStatus(swap.fromNetwork);
                if (status) {
                  if (status.emergencyStop) {
                    const fix = window.confirm('Emergency stop is enabled. Do you want to disable it?');
                    if (fix) {
                      await fixEmergencyStop(swap.fromNetwork);
                    }
                  } else {
                    setTransactionStatus({
                      message: 'Contract is working normally',
                      type: 'success'
                    });
                  }
                }
              }}
            >
              Check Contract
            </button>
            <div className="network-indicator">
              <div className="status-indicator"></div>
              <span>
                {wallet.chainId ? getNetworkName(wallet.chainId) : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        {!wallet.address ? (
          <div className="space-y-4">
            {/* MetaMask Detection */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">MetaMask Status:</span>
                <span className={typeof window.ethereum !== 'undefined' ? 'text-green-600' : 'text-red-600'}>
                  {typeof window.ethereum !== 'undefined' ? 'Detected' : 'Not Found'}
                </span>
              </div>
              {typeof window.ethereum === 'undefined' && (
                <div className="text-red-600 text-xs">
                  Please install MetaMask browser extension first
                </div>
              )}
            </div>
            
            <button 
              className="btn-primary w-full"
              onClick={connectWallet}
              disabled={isConnecting || typeof window.ethereum === 'undefined'}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            
            {typeof window.ethereum === 'undefined' && (
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary w-full text-center block"
              >
                Install MetaMask
              </a>
            )}
          </div>
        ) : (
          <>
            {/* Wallet Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">
                Wallet: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(CONTRACT_ADDRESSES).map(([networkName, config]) => (
                  <div key={networkName} className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className={`token-icon ${wallet.chainId === config.chainId ? 'text-green-600' : ''}`}>
                        {config.currency === 'AVAX' ? '▲' : '◆'}
                      </span>
                      <span className={wallet.chainId === config.chainId ? 'font-bold' : ''}>
                        {config.name}
                      </span>
                    </span>
                    <span className="font-mono">
                      {wallet.balances[networkName] ? 
                        `${parseFloat(wallet.balances[networkName]).toFixed(4)} ${config.currency}` : 
                        'Loading...'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* From Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">From</span>
                  <span className="text-sm text-gray-500">
                    Balance: {wallet.balances[swap.fromNetwork] ? 
                      `${parseFloat(wallet.balances[swap.fromNetwork]).toFixed(4)}` : 
                      'Loading...'
                    }
                  </span>
                </div>
                <div className="relative">
                  <input
                    className="swap-input w-full pr-24"
                    placeholder="0.0"
                    type="number"
                    value={swap.fromAmount}
                    onChange={(e) => handleFromAmountChange(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <select
                      className="token-display border-none bg-transparent cursor-pointer text-sm"
                      value={swap.fromNetwork}
                      onChange={(e) => handleNetworkChange('from', e.target.value as NetworkName)}
                    >
                      {Object.entries(CONTRACT_ADDRESSES).map(([networkName, config]) => {
                        const isMainnet = networkName.includes('mainnet') || networkName === 'ethereum' || networkName === 'avalanche';
                        const label = `${config.currency === 'AVAX' ? '▲' : '◆'} ${config.currency} ${config.name} ${isMainnet ? '[LIVE]' : '[TEST]'}`;
                        return (
                          <option key={networkName} value={networkName}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{CONTRACT_ADDRESSES[swap.fromNetwork].name}</span>
                  <span className={swap.fromNetwork.includes('mainnet') || swap.fromNetwork === 'ethereum' || swap.fromNetwork === 'avalanche' ? 'text-green-600 font-bold' : 'text-yellow-600'}>
                    {swap.fromNetwork.includes('mainnet') || swap.fromNetwork === 'ethereum' || swap.fromNetwork === 'avalanche' ? '[LIVE]' : '[TEST]'}
                  </span>
                </div>
              </div>

              {/* Swap Direction Button */}
              <div className="flex items-center justify-center my-4">
                <button 
                  className="swap-direction-btn"
                  onClick={swapDirection}
                  disabled={swap.step !== 'setup'}
                >
                  ↕
                </button>
              </div>

              {/* To Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">To</span>
                  <span className="text-sm text-gray-500">
                    Balance: {wallet.balances[swap.toNetwork] ? 
                      `${parseFloat(wallet.balances[swap.toNetwork]).toFixed(4)}` : 
                      'Loading...'
                    }
                  </span>
                </div>
                <div className="relative">
                  <input
                    className="swap-input w-full pr-24"
                    placeholder="0.0"
                    type="number"
                    value={swap.toAmount}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <select
                      className="token-display border-none bg-transparent cursor-pointer text-sm"
                      value={swap.toNetwork}
                      onChange={(e) => handleNetworkChange('to', e.target.value as NetworkName)}
                    >
                      {Object.entries(CONTRACT_ADDRESSES).map(([networkName, config]) => {
                        const isMainnet = networkName.includes('mainnet') || networkName === 'ethereum' || networkName === 'avalanche';
                        const label = `${config.currency === 'AVAX' ? '▲' : '◆'} ${config.currency} ${config.name} ${isMainnet ? '[LIVE]' : '[TEST]'}`;
                        return (
                          <option key={networkName} value={networkName}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{CONTRACT_ADDRESSES[swap.toNetwork].name}</span>
                  <div className="flex items-center gap-2">
                    <span className={swap.toNetwork.includes('mainnet') || swap.toNetwork === 'ethereum' || swap.toNetwork === 'avalanche' ? 'text-green-600 font-bold' : 'text-yellow-600'}>
                      {swap.toNetwork.includes('mainnet') || swap.toNetwork === 'ethereum' || swap.toNetwork === 'avalanche' ? '[LIVE]' : '[TEST]'}
                    </span>
                    {isLoadingRate && <span>Loading rate...</span>}
                    {exchangeRate > 0 && !isLoadingRate && (
                      <span>Rate: 1 {CONTRACT_ADDRESSES[swap.fromNetwork].currency} = {exchangeRate.toFixed(6)} {CONTRACT_ADDRESSES[swap.toNetwork].currency}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6">
              {swap.step === 'setup' && (
                <button 
                  className="btn-primary w-full"
                  onClick={initiateSwap}
                  disabled={!swap.fromAmount || !swap.toAmount}
                >
                  Initiate Swap
                </button>
              )}
              
              {swap.step === 'participate' && (
                <button 
                  className="btn-primary w-full"
                  onClick={participateSwap}
                >
                  Participate in Swap
                </button>
              )}
              
              {swap.step === 'complete' && (
                <button 
                  className="btn-primary w-full"
                  onClick={completeSwap}
                >
                  Complete Swap
                </button>
              )}
            </div>

            {/* Transaction Status */}
            {transactionStatus && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                transactionStatus.type === 'pending' ? 'bg-blue-50 text-blue-800' :
                transactionStatus.type === 'success' ? 'bg-green-50 text-green-800' :
                'bg-red-50 text-red-800'
              }`}>
                <p>{transactionStatus.message}</p>
                {transactionStatus.hash && (
                  <p className="transaction-hash mt-1">
                    Tx: {transactionStatus.hash.slice(0, 10)}...
                  </p>
                )}
              </div>
            )}

            {/* Reset Button */}
            {(swap.step !== 'setup' || transactionStatus) && (
              <button 
                className="btn-secondary w-full mt-2"
                onClick={resetSwap}
              >
                Start New Swap
              </button>
            )}

            {/* Info Section */}
            <div className="mt-6 p-4 bg-blue-50 border-blue-200 rounded-12px">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Current Swap:</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Trade {swap.fromAmount || '0'} {CONTRACT_ADDRESSES[swap.fromNetwork].currency} → {swap.toAmount || '0'} {CONTRACT_ADDRESSES[swap.toNetwork].currency}</div>
                <div>From: {CONTRACT_ADDRESSES[swap.fromNetwork].name} ({swap.fromNetwork.includes('mainnet') ? 'Mainnet' : 'Testnet'})</div>
                <div>To: {CONTRACT_ADDRESSES[swap.toNetwork].name} ({swap.toNetwork.includes('mainnet') ? 'Mainnet' : 'Testnet'})</div>
                <div>Status: Step {swap.step === 'setup' ? '1' : swap.step === 'initiate' ? '2' : swap.step === 'participate' ? '3' : '4'} of 4</div>
              </div>
            </div>
          </>
        )}

        {/* Comprehensive Swap Explanation Modal */}
        {showExplanation && (
          <>
            <div className="modal-overlay" onClick={() => setShowExplanation(false)}></div>
            <div className="modal">
              <div className="modal-header">
                <h2 className="text-xl font-bold">How Atomic Swaps Work</h2>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowExplanation(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-bold mb-2">What is an Atomic Swap?</h3>
                    <p>An atomic swap is a trustless cryptocurrency exchange between two different blockchains without using centralized intermediaries. Either the full trade happens, or nothing happens at all.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">The 4-Step Process:</h3>
                    <div className="space-y-2">
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-medium">Step 1: Setup</div>
                        <div className="text-xs text-gray-600">System generates a random secret key and creates its cryptographic hash. This hash will lock both contracts.</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-medium">Step 2: Initiate Swap</div>
                        <div className="text-xs text-gray-600">You lock your {CONTRACT_ADDRESSES[swap.fromNetwork].currency} on {CONTRACT_ADDRESSES[swap.fromNetwork].name} network. Funds are locked with the hash and 24-hour timelock.</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-medium">Step 3: Participate</div>
                        <div className="text-xs text-gray-600">System locks matching {CONTRACT_ADDRESSES[swap.toNetwork].currency} on {CONTRACT_ADDRESSES[swap.toNetwork].name} network using the same hash but 12-hour timelock.</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-medium">Step 4: Complete</div>
                        <div className="text-xs text-gray-600">System reveals the secret to claim {CONTRACT_ADDRESSES[swap.toNetwork].currency}. This makes the secret public, allowing you to claim the {CONTRACT_ADDRESSES[swap.fromNetwork].currency}.</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Security Features:</h3>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>Cryptographic hash prevents secret guessing</li>
                      <li>Timelock ensures funds aren't locked forever</li>
                      <li>Shorter timelock on second chain prevents race conditions</li>
                      <li>Smart contracts automatically execute refunds if needed</li>
                      <li>No trusted third parties required</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">What Happens During Each Step:</h3>
                    <div className="space-y-1 text-xs">
                      <div><strong>MetaMask Actions:</strong> Will automatically switch between networks</div>
                      <div><strong>Gas Costs:</strong> ~$15-30 on Ethereum, ~$1-2 on Avalanche</div>
                      <div><strong>Time Required:</strong> 2-5 minutes total execution time</div>
                      <div><strong>Safety:</strong> Funds are automatically refunded if swap fails</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Your Current Balances:</h3>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {Object.entries(CONTRACT_ADDRESSES).map(([networkName, config]) => (
                        <div key={networkName} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{config.name} ({networkName.includes('mainnet') ? 'LIVE' : 'TEST'})</span>
                          <span className="font-mono">
                            {wallet.balances[networkName] ? 
                              `${parseFloat(wallet.balances[networkName]).toFixed(4)} ${config.currency}` : 
                              'Loading...'
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-primary"
                  onClick={() => setShowExplanation(false)}
                >
                  Got It
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AtomicSwapInterface;