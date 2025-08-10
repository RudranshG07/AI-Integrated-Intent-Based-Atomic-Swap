import React, { useState } from 'react';
import { ethers } from 'ethers';

interface SwapIntent {
  id: string;
  initiator: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromNetwork: string;
  toNetwork: string;
  status: 'pending' | 'matched' | 'locked' | 'completed' | 'expired';
  timestamp: number;
  hashLock?: string;
  secret?: string;
  contractId?: string;
  counterpartyContractId?: string;
}

interface WalletState {
  address: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  network: string | null;
}

// Contract ABIs
const HTLC_ABI = [
  "function initiateNativeSwap(address _participant, bytes32 _hashLock, uint256 _timelock, string memory _swapId) external payable returns (bytes32 contractId)",
  "function initiateTokenSwap(address _participant, address _tokenAddress, uint256 _amount, bytes32 _hashLock, uint256 _timelock, string memory _swapId) external returns (bytes32 contractId)",
  "function withdraw(bytes32 _contractId, bytes32 _secret) external",
  "function refund(bytes32 _contractId) external",
  "function getSwap(bytes32 _contractId) external view returns (address initiator, address participant, address tokenAddress, uint256 amount, bytes32 hashLock, uint256 timelock, bool withdrawn, bool refunded, string memory swapId)",
  "function isWithdrawable(bytes32 _contractId, bytes32 _secret) external view returns (bool)",
  "function isRefundable(bytes32 _contractId) external view returns (bool)",
  "event SwapInitiated(bytes32 indexed contractId, address indexed initiator, address indexed participant, address tokenAddress, uint256 amount, bytes32 hashLock, uint256 timelock, string swapId)",
  "event SwapWithdrawn(bytes32 indexed contractId, bytes32 secret, uint256 withdrawnAt)",
  "event SwapRefunded(bytes32 indexed contractId, uint256 refundedAt)"
];

// Contract addresses - UPDATED WITH DEPLOYED CONTRACTS
const CONTRACTS = {
  fuji: "0xE4843c1dFb366e59C694317165B2BaCA654E04a6",
  sepolia: "0x4005f23BD3054D8F1e3583F78C7f2fbf38AE1482"
};

// Network configurations
const NETWORKS = {
  fuji: {
    chainId: '0xa869', // 43113 in hex
    name: 'Avalanche Fuji',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorer: 'https://testnet.snowtrace.io',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 }
  },
  sepolia: {
    chainId: '0xaa36a7', // 11155111 in hex
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    explorer: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  }
};

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export const SimpleAtomicSwap: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    provider: null,
    signer: null,
    network: null
  });
  
  const [intents, setIntents] = useState<SwapIntent[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Load intents from backend
  const loadIntents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/intents');
      if (response.ok) {
        const backendIntents = await response.json();
        setIntents(backendIntents.map((intent: any) => ({
          id: intent.id,
          initiator: intent.initiator,
          fromToken: intent.fromToken,
          toToken: intent.toToken,
          fromAmount: intent.fromAmount,
          toAmount: intent.toAmount,
          fromNetwork: intent.fromNetwork,
          toNetwork: intent.toNetwork,
          status: intent.status === 'active' ? 'pending' : intent.status,
          timestamp: intent.timestamp,
          hashLock: intent.hashLock,
          secret: intent.secret
        })));
      }
    } catch (error) {
      addLog('Failed to load intents from backend');
    }
  };

  // Load intents on component mount
  React.useEffect(() => {
    loadIntents();
    const interval = setInterval(loadIntents, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      let networkName = '';
      if (network.chainId === 43113) networkName = 'fuji';
      else if (network.chainId === 11155111) networkName = 'sepolia';
      else {
        throw new Error(`Unsupported network. Please switch to Fuji or Sepolia`);
      }

      setWallet({ address, provider, signer, network: networkName });
      addLog(`Connected to ${address} on ${networkName}`);
      
      // Listen for account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            setWallet({ address: null, provider: null, signer: null, network: null });
            addLog('Wallet disconnected');
          }
        });
      }

    } catch (error: any) {
      addLog(`Connection failed: ${error.message}`);
    }
  };

  // Switch network
  const switchNetwork = async (targetNetwork: string) => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found');
      }
      
      const networkConfig = NETWORKS[targetNetwork as keyof typeof NETWORKS];
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, try to add it
        const networkConfig = NETWORKS[targetNetwork as keyof typeof NETWORKS];
        try {
          if (typeof window.ethereum !== 'undefined') {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: networkConfig.chainId,
                chainName: networkConfig.name,
                nativeCurrency: networkConfig.nativeCurrency,
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.explorer]
              }],
            });
          }
        } catch (addError: any) {
          addLog(`Failed to add network: ${addError.message}`);
        }
      } else {
        addLog(`Failed to switch network: ${error.message}`);
      }
    }
  };

  // Parse user intent with AI (simplified for demo)
  const parseUserIntent = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Simple regex patterns
    const swapMatch = lowerInput.match(/swap.*?(\d+\.?\d*)\s*(avax|eth).*?to\s*(avax|eth)/);
    
    if (swapMatch) {
      const amount = swapMatch[1];
      const fromToken = swapMatch[2].toUpperCase();
      const toToken = swapMatch[3].toUpperCase();
      
      // Calculate estimated output (simplified rate: 1 AVAX = 0.0135 ETH)
      let toAmount = '';
      if (fromToken === 'AVAX' && toToken === 'ETH') {
        toAmount = (parseFloat(amount) * 0.0135).toFixed(6);
      } else if (fromToken === 'ETH' && toToken === 'AVAX') {
        toAmount = (parseFloat(amount) / 0.0135).toFixed(4);
      }

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount,
        fromNetwork: fromToken === 'AVAX' ? 'fuji' : 'sepolia',
        toNetwork: toToken === 'AVAX' ? 'fuji' : 'sepolia'
      };
    }
    
    return null;
  };

  // Create swap intent
  const createSwapIntent = async () => {
    if (!wallet.address || !userInput.trim()) return;
    
    setIsCreatingIntent(true);
    try {
      const parsed = parseUserIntent(userInput);
      if (!parsed) {
        throw new Error('Could not parse intent. Try: "Swap 0.01 AVAX to ETH"');
      }

      addLog(`Generating intent: ${parsed.fromAmount} ${parsed.fromToken} to ${parsed.toAmount} ${parsed.toToken}`);

      // Post intent to backend API
      const response = await fetch('http://localhost:3001/api/intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initiator: wallet.address,
          fromToken: parsed.fromToken,
          toToken: parsed.toToken,
          fromAmount: parsed.fromAmount,
          fromNetwork: parsed.fromNetwork,
          toNetwork: parsed.toNetwork,
          userInput: userInput.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post intent to backend');
      }

      const result = await response.json();
      const intent: SwapIntent = {
        id: result.intent.id,
        initiator: result.intent.initiator,
        fromToken: result.intent.fromToken,
        toToken: result.intent.toToken,
        fromAmount: result.intent.fromAmount,
        toAmount: result.intent.toAmount,
        fromNetwork: result.intent.fromNetwork,
        toNetwork: result.intent.toNetwork,
        status: 'pending',
        timestamp: result.intent.timestamp,
        hashLock: result.intent.hashLock,
        secret: result.intent.secret
      };

      // Add to local intent pool
      setIntents(prev => [intent, ...prev]);
      addLog(`Intent generated: ${intent.id}`);
      addLog('Intent posted to pool - visible to other users');
      
      // Clear input
      setUserInput('');

    } catch (error: any) {
      addLog(`Failed to generate intent: ${error.message}`);
    } finally {
      setIsCreatingIntent(false);
    }
  };

  // Match an intent (simulate another user)
  const matchIntent = async (intent: SwapIntent) => {
    if (!wallet.address) return;
    
    try {
      addLog(`Matching intent ${intent.id}...`);
      
      // Update intent status
      setIntents(prev => prev.map(i => 
        i.id === intent.id ? { ...i, status: 'matched' } : i
      ));
      
      addLog('Intent matched! Both users must now lock funds in HTLCs');
      
      // Start HTLC creation process
      setTimeout(() => createHTLCContracts(intent), 2000);
      
    } catch (error: any) {
      addLog(`Failed to match intent: ${error.message}`);
    }
  };

  // Create HTLC contracts on both chains
  const createHTLCContracts = async (intent: SwapIntent) => {
    if (!wallet.signer || !intent.hashLock) return;
    
    try {
      addLog('Creating HTLC contracts on both chains...');
      
      // Set timelock (2 hours for Fuji, 4 hours for Sepolia due to slower finality)
      const fujiTimelock = Math.floor(Date.now() / 1000) + 7200; // 2 hours
      const sepoliaTimelock = Math.floor(Date.now() / 1000) + 14400; // 4 hours
      
      // For demo, create contract on current network
      const contractAddress = wallet.network === 'fuji' ? CONTRACTS.fuji : CONTRACTS.sepolia;
      const contract = new ethers.Contract(contractAddress, HTLC_ABI, wallet.signer);
      
      // Mock participant address (in real app, this would be the matched user)
      const participant = '0x742d35Cc6635C0532925a3b8D73C0D5B4eb3B6B8';
      
      const timelock = wallet.network === 'fuji' ? fujiTimelock : sepoliaTimelock;
      const amount = ethers.utils.parseEther(intent.fromAmount);
      
      addLog(`Creating HTLC on ${wallet.network} for ${intent.fromAmount} ${intent.fromToken}`);
      
      const tx = await contract.initiateNativeSwap(
        participant,
        intent.hashLock,
        timelock,
        intent.id,
        { value: amount, gasLimit: 300000 }
      );
      
      addLog(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      
      // Extract contract ID from events
      const event = receipt.events?.find((e: any) => e.event === 'SwapInitiated');
      const contractId = event?.args?.contractId;
      
      // Update intent
      setIntents(prev => prev.map(i => 
        i.id === intent.id ? { 
          ...i, 
          status: 'locked',
          contractId: contractId
        } : i
      ));
      
      addLog(`HTLC created with contract ID: ${contractId}`);
      addLog('Waiting for counterparty to create their HTLC...');
      
      // Simulate counterparty creating their HTLC
      setTimeout(() => {
        const counterpartyContractId = ethers.utils.hexlify(ethers.utils.randomBytes(32));
        setIntents(prev => prev.map(i => 
          i.id === intent.id ? { 
            ...i, 
            counterpartyContractId: counterpartyContractId
          } : i
        ));
        addLog(`Counterparty HTLC created: ${counterpartyContractId}`);
        addLog('Both HTLCs are now active. You can claim from either side.');
      }, 5000);
      
    } catch (error: any) {
      addLog(`Failed to create HTLC: ${error.message}`);
    }
  };

  // Withdraw from HTLC (reveal secret)
  const withdrawFromHTLC = async (intent: SwapIntent) => {
    if (!wallet.signer || !intent.secret || !intent.counterpartyContractId) return;
    
    try {
      addLog('Withdrawing from counterparty HTLC (this will reveal the secret)...');
      
      // Switch to the counterparty network first
      const targetNetwork = intent.toNetwork;
      if (wallet.network !== targetNetwork) {
        await switchNetwork(targetNetwork);
        // Wait for network switch
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const contractAddress = targetNetwork === 'fuji' ? CONTRACTS.fuji : CONTRACTS.sepolia;
      const contract = new ethers.Contract(contractAddress, HTLC_ABI, wallet.signer);
      
      const tx = await contract.withdraw(intent.counterpartyContractId, intent.secret, {
        gasLimit: 200000
      });
      addLog(`Withdrawal transaction sent: ${tx.hash}`);
      
      await tx.wait();
      addLog('Withdrawal successful! Secret revealed on-chain');
      
      // Extract secret from transaction (for demo purposes)
      addLog(`Revealed secret: ${intent.secret}`);
      addLog('Counterparty can now extract this secret and withdraw from your HTLC');
      
      // Update intent status
      setIntents(prev => prev.map(i => 
        i.id === intent.id ? { ...i, status: 'completed' } : i
      ));
      
      addLog('Atomic swap completed successfully!');
      
    } catch (error: any) {
      addLog(`Failed to withdraw: ${error.message}`);
    }
  };

  // Refund HTLC after timeout
  const refundHTLC = async (intent: SwapIntent) => {
    if (!wallet.signer || !intent.contractId) return;
    
    try {
      addLog('Attempting refund...');
      
      const contractAddress = wallet.network === 'fuji' ? CONTRACTS.fuji : CONTRACTS.sepolia;
      const contract = new ethers.Contract(contractAddress, HTLC_ABI, wallet.signer);
      
      const tx = await contract.refund(intent.contractId, {
        gasLimit: 150000
      });
      addLog(`Refund transaction sent: ${tx.hash}`);
      
      await tx.wait();
      addLog('Refund successful! Funds returned');
      
      // Update intent status
      setIntents(prev => prev.map(i => 
        i.id === intent.id ? { ...i, status: 'expired' } : i
      ));
      
    } catch (error: any) {
      addLog(`Failed to refund: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Intent Generator</h1>
        
        {/* Wallet Connection */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Wallet Connection</h2>
          {!wallet.address ? (
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Connect MetaMask
            </button>
          ) : (
            <div className="space-y-2">
              <p>Connected: {wallet.address}</p>
              <p>Network: {wallet.network}</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => switchNetwork('fuji')}
                  className={`px-4 py-2 rounded transition-colors ${
                    wallet.network === 'fuji' 
                      ? 'bg-green-600' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  Avalanche Fuji
                </button>
                <button
                  onClick={() => switchNetwork('sepolia')}
                  className={`px-4 py-2 rounded transition-colors ${
                    wallet.network === 'sepolia' 
                      ? 'bg-green-600' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  Ethereum Sepolia
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intent Creation */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Generate Intent</h2>
            <div className="space-y-4">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Describe your swap: 'Swap 0.01 AVAX to ETH'"
                className="w-full h-24 bg-gray-700 text-white border border-gray-600 rounded-lg p-4 resize-none focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={createSwapIntent}
                disabled={!wallet.address || isCreatingIntent}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {isCreatingIntent ? 'Generating...' : 'Generate Intent'}
              </button>
            </div>
          </div>

          {/* Intent Pool */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Intent Pool</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {intents.length === 0 ? (
                <p className="text-gray-400">No intents available</p>
              ) : (
                intents.map(intent => (
                  <div key={intent.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">
                          {intent.fromAmount} {intent.fromToken} → {intent.toAmount} {intent.toToken}
                        </p>
                        <p className="text-sm text-gray-400">
                          {intent.fromNetwork} → {intent.toNetwork}
                        </p>
                        <p className="text-xs text-gray-500">
                          By: {intent.initiator.slice(0, 8)}...
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        intent.status === 'pending' ? 'bg-yellow-600' :
                        intent.status === 'matched' ? 'bg-blue-600' :
                        intent.status === 'locked' ? 'bg-purple-600' :
                        intent.status === 'completed' ? 'bg-green-600' :
                        'bg-red-600'
                      }`}>
                        {intent.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      {intent.status === 'pending' && intent.initiator !== wallet.address && (
                        <button
                          onClick={() => matchIntent(intent)}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm transition-colors"
                        >
                          Match Intent
                        </button>
                      )}
                      
                      {intent.status === 'locked' && intent.initiator === wallet.address && intent.counterpartyContractId && (
                        <button
                          onClick={() => withdrawFromHTLC(intent)}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm transition-colors"
                        >
                          Claim Funds
                        </button>
                      )}
                      
                      {intent.status === 'locked' && intent.initiator === wallet.address && (
                        <button
                          onClick={() => refundHTLC(intent)}
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors"
                        >
                          Refund (if expired)
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">System Logs</h2>
          <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 text-green-400">
                  {log}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setLogs([])}
            className="mt-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
};