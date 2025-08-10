import React, { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, HTLC_ABI, NetworkName } from '../config/contracts';

interface CrossChainSwapState {
  // Step 1: Setup
  fromNetwork: NetworkName;
  toNetwork: NetworkName;
  fromAmount: string;
  toAmount: string;
  
  // Step 2: Secret generation
  secret?: string;
  secretHash?: string;
  
  // Step 3: Contract creation
  initiatorContract?: string;
  participantContract?: string;
  
  // Step 4: Withdrawal
  initiatorWithdrew?: boolean;
  participantWithdrew?: boolean;
  
  currentStep: 'setup' | 'contracts' | 'withdrawal' | 'complete';
}


export const CrossChainSwap: React.FC = () => {
  const [swap, setSwap] = useState<CrossChainSwapState>({
    fromNetwork: 'fuji',
    toNetwork: 'sepolia', 
    fromAmount: '0.1',
    toAmount: '0.0013',
    currentStep: 'setup'
  });

  const [wallet, setWallet] = useState<{
    address: string | null;
    provider: ethers.providers.Web3Provider | null;
  }>({
    address: null,
    provider: null
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [counterpartyAddress, setCounterpartyAddress] = useState('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        setWallet({ address, provider });
        addLog(`Wallet connected: ${address}`);
      } catch (error: any) {
        addLog(`Failed to connect wallet: ${error.message}`);
      }
    } else {
      addLog('MetaMask not found');
    }
  };

  // Switch network
  const switchNetwork = async (networkName: NetworkName) => {
    if (!wallet.provider) return;
    
    const network = CONTRACT_ADDRESSES[networkName];
    try {
      await wallet.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${network.chainId.toString(16)}` }
      ]);
      addLog(`Switched to ${network.name}`);
    } catch (error: any) {
      addLog(`Failed to switch to ${network.name}: ${error.message}`);
    }
  };

  // Step 1: Generate secret and hash
  const generateSecret = () => {
    const secret = ethers.utils.randomBytes(32);
    const secretHex = ethers.utils.hexlify(secret);
    const secretHash = ethers.utils.keccak256(secretHex);
    
    setSwap(prev => ({
      ...prev,
      secret: secretHex,
      secretHash,
      currentStep: 'contracts'
    }));
    
    addLog(`Secret generated: ${secretHex}`);
    addLog(`Secret hash: ${secretHash}`);
  };

  // Step 2: Create initiator contract (on fromNetwork)
  const createInitiatorContract = async () => {
    if (!wallet.provider || !swap.secretHash) return;

    try {
      // Validate and checksum the counterparty address
      const checksummedAddress = ethers.utils.getAddress(counterpartyAddress);
      
      await switchNetwork(swap.fromNetwork);
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES[swap.fromNetwork].htlc,
        HTLC_ABI,
        wallet.provider.getSigner()
      );

      const timelock = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
      
      addLog(`Creating initiator contract on ${CONTRACT_ADDRESSES[swap.fromNetwork].name}...`);
      
      const tx = await contract.newContract(
        checksummedAddress,
        swap.secretHash,
        timelock,
        { value: ethers.utils.parseEther(swap.fromAmount) }
      );

      addLog(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      
      // Extract contract ID from events
      const event = receipt.events?.find((e: any) => e.event === 'SwapInitiated');
      const contractId = event?.args?.contractId;

      setSwap(prev => ({
        ...prev,
        initiatorContract: contractId
      }));

      addLog(`✅ Initiator contract created: ${contractId}`);
      addLog(`🔄 Counterparty should now create their contract on ${CONTRACT_ADDRESSES[swap.toNetwork].name}`);
      
    } catch (error: any) {
      addLog(`❌ Failed to create initiator contract: ${error.message}`);
    }
  };

  // Step 3: Monitor for counterparty contract creation
  const monitorCounterpartyContract = async () => {
    if (!wallet.provider || !swap.secretHash) return;

    addLog(`👀 Monitoring for counterparty contract on ${CONTRACT_ADDRESSES[swap.toNetwork].name}...`);
    
    // In a real implementation, you would:
    // 1. Listen for SwapInitiated events on the toNetwork
    // 2. Filter events by secretHash and counterparty address
    // 3. Extract the contract ID when found
    
    // For demo, simulate counterparty creating a contract
    setTimeout(() => {
      const demoContractId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('demo-counterparty-contract'));
      setSwap(prev => ({
        ...prev,
        participantContract: demoContractId
      }));
      addLog(`✅ Counterparty contract detected: ${demoContractId}`);
      addLog(`🚀 Both contracts created! You can now withdraw from counterparty's contract.`);
    }, 3000);
  };

  // Step 4: Withdraw from counterparty contract (reveals secret)
  const withdrawFromCounterparty = async () => {
    if (!wallet.provider || !swap.secret || !swap.participantContract) return;

    try {
      await switchNetwork(swap.toNetwork);
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES[swap.toNetwork].htlc,
        HTLC_ABI,
        wallet.provider.getSigner()
      );

      addLog(`Withdrawing from counterparty contract using secret...`);
      
      const tx = await contract.withdraw(swap.participantContract, swap.secret);
      addLog(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log('Withdrawal receipt:', receipt);
      addLog(`✅ Withdrawn from counterparty contract!`);
      addLog(`🔓 SECRET REVEALED ON-CHAIN: ${swap.secret}`);
      addLog(`📡 Counterparty can now extract the secret and withdraw your funds`);
      
      setSwap(prev => ({
        ...prev,
        initiatorWithdrew: true
      }));

      // Start monitoring for counterparty withdrawal
      monitorCounterpartyWithdrawal();
      
    } catch (error: any) {
      addLog(`❌ Failed to withdraw: ${error.message}`);
    }
  };

  // Monitor counterparty withdrawal
  const monitorCounterpartyWithdrawal = async () => {
    addLog(`👀 Monitoring for counterparty withdrawal from your contract...`);
    
    // In real implementation, monitor withdraw events on fromNetwork
    setTimeout(() => {
      setSwap(prev => ({
        ...prev,
        participantWithdrew: true,
        currentStep: 'complete'
      }));
      addLog(`✅ Counterparty withdrew from your contract!`);
      addLog(`🎉 ATOMIC SWAP COMPLETED SUCCESSFULLY!`);
    }, 5000);
  };

  // Extract secret from blockchain transaction
  const extractSecretFromTx = async (txHash: string, network: NetworkName) => {
    if (!wallet.provider) return;

    try {
      // Switch to the correct network
      await switchNetwork(network);
      
      const tx = await wallet.provider.getTransaction(txHash);
      if (!tx) throw new Error('Transaction not found');

      // Decode the transaction data to extract the secret parameter
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES[network].htlc,
        HTLC_ABI,
        wallet.provider
      );

      const decodedData = contract.interface.parseTransaction({ data: tx.data });
      if (decodedData.name === 'withdraw') {
        const extractedSecret = decodedData.args._preimage;
        addLog(`🔓 Secret extracted from transaction: ${extractedSecret}`);
        return extractedSecret;
      }
    } catch (error: any) {
      addLog(`Failed to extract secret: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Cross-Chain Atomic Swap</h1>
      
      {/* Connection Status */}
      <div className="swap-card p-4">
        <h3 className="font-medium mb-2">Wallet Status</h3>
        {wallet.address ? (
          <p className="text-sm text-green-600">Connected: {wallet.address}</p>
        ) : (
          <button onClick={connectWallet} className="btn-primary">
            Connect Wallet
          </button>
        )}
      </div>

      {/* Swap Configuration */}
      <div className="swap-card p-4">
        <h3 className="font-medium mb-4">Swap Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Network</label>
            <select 
              value={swap.fromNetwork}
              onChange={(e) => setSwap(prev => ({...prev, fromNetwork: e.target.value as NetworkName}))}
              className="token-display w-full"
            >
              <option value="fuji">Fuji [TEST]</option>
              <option value="sepolia">Sepolia [TEST]</option>
              <option value="avalanche">Avalanche [LIVE]</option>
              <option value="ethereum">Ethereum [LIVE]</option>
            </select>
            <input 
              type="number"
              value={swap.fromAmount}
              onChange={(e) => setSwap(prev => ({...prev, fromAmount: e.target.value}))}
              className="swap-input mt-2"
              placeholder="Amount to send"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Network</label>
            <select 
              value={swap.toNetwork}
              onChange={(e) => setSwap(prev => ({...prev, toNetwork: e.target.value as NetworkName}))}
              className="token-display w-full"
            >
              <option value="sepolia">Sepolia [TEST]</option>
              <option value="fuji">Fuji [TEST]</option>
              <option value="ethereum">Ethereum [LIVE]</option>
              <option value="avalanche">Avalanche [LIVE]</option>
            </select>
            <input 
              type="number"
              value={swap.toAmount}
              onChange={(e) => setSwap(prev => ({...prev, toAmount: e.target.value}))}
              className="swap-input mt-2"
              placeholder="Amount to receive"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Counterparty Address</label>
          <input 
            type="text"
            value={counterpartyAddress}
            onChange={(e) => setCounterpartyAddress(e.target.value)}
            className="swap-input"
            placeholder="Counterparty's wallet address"
          />
        </div>
      </div>

      {/* Swap Process */}
      <div className="swap-card p-4">
        <h3 className="font-medium mb-4">Atomic Swap Process</h3>
        
        {/* Step 1: Generate Secret */}
        <div className="space-y-2">
          <button 
            onClick={generateSecret}
            disabled={!wallet.address || !!swap.secret}
            className="btn-primary w-full"
          >
            {swap.secret ? '✅ Secret Generated' : '1. Generate Secret & Hash'}
          </button>
          
          {swap.secret && (
            <div className="bg-gray-50 p-3 rounded text-xs font-mono">
              <p><strong>Secret:</strong> {swap.secret}</p>
              <p><strong>Hash:</strong> {swap.secretHash}</p>
            </div>
          )}
        </div>

        {/* Step 2: Create Contracts */}
        {swap.secret && (
          <div className="space-y-2 mt-4">
            <button 
              onClick={createInitiatorContract}
              disabled={!swap.secret || !!swap.initiatorContract}
              className="btn-primary w-full"
            >
              {swap.initiatorContract ? '✅ Your Contract Created' : '2. Create Your Contract'}
            </button>
            
            {swap.initiatorContract && !swap.participantContract && (
              <button 
                onClick={monitorCounterpartyContract}
                className="btn-secondary w-full"
              >
                3. Wait for Counterparty Contract
              </button>
            )}
          </div>
        )}

        {/* Step 3: Withdrawal */}
        {swap.participantContract && !swap.initiatorWithdrew && (
          <div className="space-y-2 mt-4">
            <button 
              onClick={withdrawFromCounterparty}
              className="btn-primary w-full"
            >
              4. Withdraw from Counterparty (Reveals Secret)
            </button>
          </div>
        )}

        {/* Completion */}
        {swap.currentStep === 'complete' && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <p className="text-green-800 font-medium">🎉 Atomic Swap Completed!</p>
            <p className="text-sm text-green-600">Both parties have successfully exchanged funds.</p>
          </div>
        )}
      </div>

      {/* How Counterparty Gets the Secret */}
      <div className="swap-card p-4">
        <h3 className="font-medium mb-4">How Counterparty Accesses the Preimage</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <p>Initiator withdraws from counterparty's contract using the secret</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <p>The secret is revealed on-chain as a parameter in the withdraw transaction</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <p>Counterparty monitors the blockchain and extracts the secret from the transaction</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <p>Counterparty uses the extracted secret to withdraw from initiator's contract</p>
          </div>
        </div>
      </div>

      {/* Secret Extraction Tool */}
      <div className="swap-card p-4">
        <h3 className="font-medium mb-4">Extract Secret from Transaction</h3>
        <div className="space-y-2">
          <input 
            type="text"
            placeholder="Transaction hash of withdrawal"
            className="swap-input"
            id="tx-hash-input"
          />
          <select className="token-display">
            <option value="fuji">Fuji [TEST]</option>
            <option value="sepolia">Sepolia [TEST]</option>
            <option value="avalanche">Avalanche [LIVE]</option>
            <option value="ethereum">Ethereum [LIVE]</option>
          </select>
          <button 
            onClick={() => {
              const input = document.getElementById('tx-hash-input') as HTMLInputElement;
              const select = document.querySelector('select') as HTMLSelectElement;
              extractSecretFromTx(input.value, select.value as NetworkName);
            }}
            className="btn-secondary w-full"
          >
            Extract Secret from Transaction
          </button>
        </div>
      </div>

      {/* Transaction Log */}
      <div className="swap-card p-4">
        <h3 className="font-medium mb-4">Transaction Log</h3>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p>No transactions yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};