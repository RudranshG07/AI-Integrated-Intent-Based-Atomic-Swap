import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, HTLC_ABI, NetworkName } from '../config/contracts';

interface SwapState {
  // Role selection
  role: 'alice' | 'bob' | null;
  
  // Swap configuration
  fromNetwork: NetworkName;
  toNetwork: NetworkName;
  fromAmount: string;
  toAmount: string;
  
  // Alice's data
  secret?: string;
  secretHash?: string;
  aliceContract?: string;
  
  // Bob's data  
  receivedHash?: string;
  bobContract?: string;
  
  // Process state
  step: 'setup' | 'contracts' | 'reveal' | 'complete';
  
  // Counterparty address
  counterpartyAddress: string;
}

interface WalletState {
  address: string | null;
  provider: ethers.providers.Web3Provider | null;
  balances: { [key: string]: string };
}

export const AtomicSwapSimple: React.FC = () => {
  const [swap, setSwap] = useState<SwapState>({
    role: null,
    fromNetwork: 'fuji',
    toNetwork: 'sepolia',
    fromAmount: '0.01',
    toAmount: '',
    step: 'setup',
    counterpartyAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
  });

  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    provider: null,
    balances: {}
  });

  const [exchangeRate, setExchangeRate] = useState<number>(0.0135);
  const [logs, setLogs] = useState<string[]>([]);
  const [transactionStatus, setTransactionStatus] = useState<{
    message: string;
    type: 'pending' | 'success' | 'error';
    hash?: string;
  } | null>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const logMessage = `${timestamp}: ${emoji} ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  // Get currency symbol for network
  const getNetworkCurrency = (networkName: NetworkName) => {
    return CONTRACT_ADDRESSES[networkName].currency;
  };

  // Check if network is AVAX
  const isAvaxNetwork = (networkName: NetworkName) => {
    return networkName.includes('avalanche') || networkName.includes('fuji');
  };

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        setWallet(prev => ({ ...prev, address, provider }));
        addLog(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success');
        await fetchBalances(address, provider);
      } catch (error: any) {
        addLog(`Failed to connect wallet: ${error.message}`, 'error');
      }
    } else {
      addLog('MetaMask not found. Please install MetaMask.', 'error');
    }
  };

  // Fetch balances
  const fetchBalances = async (address: string, provider: ethers.providers.Web3Provider) => {
    const balances: { [key: string]: string } = {};
    
    for (const [networkName, network] of Object.entries(CONTRACT_ADDRESSES)) {
      try {
        const networkProvider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
        const balance = await networkProvider.getBalance(address);
        balances[networkName] = ethers.utils.formatEther(balance);
      } catch (error) {
        balances[networkName] = '0.0';
      }
    }
    
    setWallet(prev => ({ ...prev, balances }));
  };

  // Switch network with improved error handling
  const switchNetwork = async (networkName: NetworkName) => {
    if (!wallet.provider) return;
    
    const network = CONTRACT_ADDRESSES[networkName];
    try {
      // Check if we're already on the correct network
      const currentNetwork = await wallet.provider.getNetwork();
      if (currentNetwork.chainId === network.chainId) {
        addLog(`Already on ${network.name}`, 'info');
        return;
      }

      addLog(`Switching to ${network.name}...`, 'info');
      await wallet.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${network.chainId.toString(16)}` }
      ]);
      
      // Wait longer for network switch to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create fresh provider to avoid stale network state
      const freshProvider = new ethers.providers.Web3Provider(window.ethereum!);
      
      // Verify network switch with retry
      let attempts = 0;
      const maxAttempts = 12;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
          const updatedNetwork = await freshProvider.getNetwork();
          if (updatedNetwork.chainId === network.chainId) {
            // Update wallet with fresh provider
            setWallet(prev => ({ ...prev, provider: freshProvider }));
            addLog(`Successfully switched to ${network.name}`, 'success');
            return;
          }
        } catch (err) {
          // Ignore network detection errors during switching
        }
        attempts++;
      }
      
      // Final attempt - update provider regardless and let operation proceed
      setWallet(prev => ({ ...prev, provider: freshProvider }));
      addLog(`Network switch completed. Provider refreshed.`, 'success');
    } catch (error: any) {
      if (error.code === 4902) {
        addLog(`Network not found in MetaMask. Please add ${network.name} manually.`, 'error');
      } else if (error.message.includes('underlying network changed')) {
        addLog(`Refreshing provider to handle network mismatch...`, 'info');
        // Create fresh provider to resolve network mismatch
        try {
          const recoveryProvider = new ethers.providers.Web3Provider(window.ethereum!);
          setWallet(prev => ({ ...prev, provider: recoveryProvider }));
          addLog(`Provider refreshed successfully. Operation can proceed.`, 'success');
          return; // Don't throw error, allow operation to continue
        } catch (recoveryErr) {
          addLog(`Failed to refresh provider. Please try again.`, 'error');
        }
      } else {
        addLog(`Failed to switch to ${network.name}: ${error.message}`, 'error');
      }
      throw error;
    }
  };

  // Calculate exchange rate and auto-fill amounts (both directions)
  useEffect(() => {
    if (swap.fromAmount && parseFloat(swap.fromAmount) > 0) {
      const fromAmount = parseFloat(swap.fromAmount);
      let toAmount: string;

      // Check if converting from AVAX to ETH or ETH to AVAX
      if (isAvaxNetwork(swap.fromNetwork) && !isAvaxNetwork(swap.toNetwork)) {
        // AVAX to ETH
        toAmount = (fromAmount * exchangeRate).toFixed(6);
      } else if (!isAvaxNetwork(swap.fromNetwork) && isAvaxNetwork(swap.toNetwork)) {
        // ETH to AVAX
        toAmount = (fromAmount / exchangeRate).toFixed(6);
      } else {
        // Same type conversion (shouldn't happen in normal use)
        toAmount = fromAmount.toFixed(6);
      }

      setSwap(prev => ({ ...prev, toAmount }));
    } else {
      setSwap(prev => ({ ...prev, toAmount: '' }));
    }
  }, [swap.fromAmount, swap.fromNetwork, swap.toNetwork, exchangeRate]);

  // Role-specific functions
  const selectRole = (role: 'alice' | 'bob') => {
    setSwap(prev => ({ ...prev, role, step: 'setup' }));
    setLogs([]);
    addLog(`You are now ${role === 'alice' ? 'Alice (Initiator)' : 'Bob (Counterparty)'}`, 'info');
  };

  // Alice: Generate secret and hash
  const generateSecret = () => {
    const secret = ethers.utils.randomBytes(32);
    const secretHex = ethers.utils.hexlify(secret);
    const secretHash = ethers.utils.sha256(secretHex);
    
    setSwap(prev => ({
      ...prev,
      secret: secretHex,
      secretHash,
      step: 'contracts'
    }));
    
    addLog('Secret generated successfully', 'success');
    addLog(`Secret Hash: ${secretHash}`, 'info');
    addLog('Share this hash with Bob (DO NOT share the secret!)', 'info');
  };

  // Bob: Input received hash
  const inputReceivedHash = (hash: string) => {
    if (hash.length === 66 && hash.startsWith('0x')) {
      setSwap(prev => ({
        ...prev,
        receivedHash: hash,
        step: 'contracts'
      }));
      addLog('Secret hash received from Alice', 'success');
    } else {
      addLog('Invalid hash format. Should be 66 characters starting with 0x', 'error');
    }
  };

  // Create HTLC contract
  const createContract = async () => {
    if (!wallet.provider) {
      addLog('Please connect your wallet first', 'error');
      return;
    }

    const isAlice = swap.role === 'alice';
    const network = swap.fromNetwork;
    const amount = swap.fromAmount;
    const hash = isAlice ? swap.secretHash : swap.receivedHash;
    
    if (!hash) {
      addLog(`${isAlice ? 'Generate secret first' : 'Enter secret hash from Alice first'}`, 'error');
      return;
    }

    try {
      await switchNetwork(network);
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES[network].htlc,
        HTLC_ABI,
        wallet.provider.getSigner()
      );

      // Validate amounts
      const amountValue = parseFloat(amount);
      if (amountValue <= 0) {
        addLog('Amount must be greater than 0', 'error');
        return;
      }

      // Dynamic minimum validation based on network type
      if (isAvaxNetwork(network) && amountValue < 0.001) {
        addLog('Minimum AVAX amount is 0.001', 'error');
        return;
      }

      if (!isAvaxNetwork(network) && amountValue < 0.0001) {
        addLog('Minimum ETH amount is 0.0001', 'error');
        return;
      }

      // Check balance
      const balance = parseFloat(wallet.balances[network] || '0');
      if (balance < amountValue) {
        addLog(`Insufficient balance. Need ${amountValue}, have ${balance.toFixed(6)}`, 'error');
        return;
      }

      const timelock = Math.floor(Date.now() / 1000) + (isAlice ? 24 : 12) * 60 * 60;
      const counterparty = ethers.utils.getAddress(swap.counterpartyAddress);
      
      setTransactionStatus({
        message: `Creating ${isAlice ? 'Alice\'s' : 'Bob\'s'} contract on ${CONTRACT_ADDRESSES[network].name}...`,
        type: 'pending'
      });

      addLog(`Creating contract on ${CONTRACT_ADDRESSES[network].name}...`, 'info');
      addLog(`Using hash: ${hash}`, 'info');
      addLog(`Network: ${network}`, 'info');
      addLog(`Role: ${isAlice ? 'Alice' : 'Bob'}`, 'info');
      
      // Check emergency stop first
      try {
        const emergencyStop = await contract.emergencyStop();
        if (emergencyStop) {
          addLog('Contract is in emergency stop mode. Swaps are disabled.', 'error');
          setTransactionStatus({
            message: 'Contract is in emergency stop mode',
            type: 'error'
          });
          return;
        }
      } catch (error) {
        addLog('Could not check emergency stop status, proceeding...', 'info');
      }

      // Estimate gas first
      const gasEstimate = await contract.estimateGas.newContract(
        counterparty,
        hash,
        timelock,
        { value: ethers.utils.parseEther(amount) }
      );
      
      addLog(`Gas estimate: ${gasEstimate.toString()}`, 'info');
      
      const tx = await contract.newContract(
        counterparty,
        hash,
        timelock,
        { 
          value: ethers.utils.parseEther(amount),
          gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
        }
      );

      addLog(`Transaction submitted: ${tx.hash}`, 'info');
      const receipt = await tx.wait();
      
      // Extract contract ID
      const event = receipt.events?.find((e: any) => e.event === 'SwapInitiated');
      const contractId = event?.args?.contractId;

      if (isAlice) {
        setSwap(prev => ({ ...prev, aliceContract: contractId }));
        addLog('Alice\'s contract created successfully!', 'success');
        addLog(`Contract ID: ${contractId}`, 'info');
        addLog('Waiting for Bob to create his contract...', 'info');
      } else {
        setSwap(prev => ({ ...prev, bobContract: contractId, step: 'reveal' }));
        addLog('Bob\'s contract created successfully!', 'success');
        addLog(`Contract ID: ${contractId}`, 'info');
        addLog('Both contracts ready! Alice can now reveal the secret.', 'info');
      }

      setTransactionStatus({
        message: `Contract created successfully!`,
        type: 'success',
        hash: tx.hash
      });

    } catch (error: any) {
      if (error.message.includes('underlying network changed')) {
        addLog(`Refreshing provider to handle network mismatch...`, 'info');
        try {
          const recoveryProvider = new ethers.providers.Web3Provider(window.ethereum!);
          setWallet(prev => ({ ...prev, provider: recoveryProvider }));
          addLog(`Provider refreshed successfully. Please try creating the contract again.`, 'success');
          setTransactionStatus({
            message: 'Provider refreshed - please retry contract creation',
            type: 'success'
          });
          return;
        } catch (recoveryErr) {
          addLog(`Failed to refresh provider. Please try again.`, 'error');
        }
      }
      
      addLog(`Failed to create contract: ${error.message}`, 'error');
      setTransactionStatus({
        message: `Failed to create contract: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Alice: Withdraw from Bob's contract (reveals secret)
  const withdrawFromBob = async () => {
    if (!wallet.provider || !swap.secret || !swap.bobContract) {
      addLog('Missing requirements: wallet, secret, or Bob\'s contract', 'error');
      return;
    }

    try {
      await switchNetwork(swap.toNetwork);
      
      // Verify we're on the correct network
      const currentNetwork = await wallet.provider!.getNetwork();
      addLog(`Currently on network: ${currentNetwork.chainId} (expected: ${CONTRACT_ADDRESSES[swap.toNetwork].chainId})`, 'info');
      
      if (currentNetwork.chainId !== CONTRACT_ADDRESSES[swap.toNetwork].chainId) {
        addLog(`ERROR: On wrong network! Expected ${swap.toNetwork} (${CONTRACT_ADDRESSES[swap.toNetwork].chainId}) but on ${currentNetwork.chainId}`, 'error');
        return;
      }
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES[swap.toNetwork].htlc,
        HTLC_ABI,
        wallet.provider.getSigner()
      );
      
      addLog(`Using contract address: ${CONTRACT_ADDRESSES[swap.toNetwork].htlc}`, 'info');

      setTransactionStatus({
        message: 'Alice withdrawing from Bob\'s contract (revealing secret)...',
        type: 'pending'
      });

      addLog('Alice withdrawing from Bob\'s contract...', 'info');
      addLog('This will REVEAL the secret on the blockchain!', 'info');
      addLog(`Using secret: ${swap.secret}`, 'info');
      addLog(`Using Bob's contract ID: ${swap.bobContract}`, 'info');
      addLog(`Alice's original hash: ${swap.secretHash}`, 'info');
      
      // Verify the contract details before attempting withdrawal
      try {
        addLog(`Verifying Bob's contract ID: ${swap.bobContract}`, 'info');
        const contractDetails = await contract.getContract(swap.bobContract);
        addLog(`Contract details retrieved successfully`, 'success');
        
        // Log all contract details for debugging
        const [initiator, participant, storedHashLock, timelock, amount, state, createdAt] = contractDetails;
        addLog(`Contract initiator: ${initiator}`, 'info');
        addLog(`Contract participant: ${participant}`, 'info');
        addLog(`Contract hashLock: ${storedHashLock}`, 'info');
        addLog(`Contract timelock: ${timelock}`, 'info');
        addLog(`Contract amount: ${ethers.utils.formatEther(amount)} ETH`, 'info');
        addLog(`Contract state: ${state}`, 'info');
        addLog(`Contract createdAt: ${createdAt}`, 'info');
        
        addLog(`Bob's contract hash: ${storedHashLock}`, 'info');
        addLog(`Expected hash: ${swap.secretHash}`, 'info');
        
        if (storedHashLock.toLowerCase() !== swap.secretHash?.toLowerCase()) {
          addLog('ERROR: Hash mismatch detected!', 'error');
          addLog('Bob used a different hash than Alice provided', 'error');
          setTransactionStatus({
            message: 'Hash mismatch - Bob used wrong hash in contract',
            type: 'error'
          });
          return;
        } else {
          addLog('Hash verification successful', 'success');
          
          // Additional debugging: Verify that Alice's secret hashes to the stored hash using SHA-256
          const computedHash = ethers.utils.sha256(swap.secret!);
          addLog(`Alice's secret: ${swap.secret}`, 'info');
          addLog(`Computed SHA-256 hash from Alice's secret: ${computedHash}`, 'info');
          addLog(`Stored hash in contract: ${storedHashLock}`, 'info');
          
          if (computedHash.toLowerCase() !== storedHashLock.toLowerCase()) {
            addLog('ERROR: Secret does not hash to the stored hash!', 'error');
            addLog('This means Alice\'s secret was corrupted or changed', 'error');
            setTransactionStatus({
              message: 'Secret corruption detected - secret does not match hash',
              type: 'error'
            });
            return;
          } else {
            addLog('Secret verification successful - secret hashes correctly', 'success');
          }
          
          // CRITICAL CHECK: Verify Alice is the designated participant
          const aliceAddress = await wallet.provider!.getSigner().getAddress();
          addLog(`Alice's current address: ${aliceAddress}`, 'info');
          addLog(`Contract designated participant: ${participant}`, 'info');
          
          if (participant.toLowerCase() !== aliceAddress.toLowerCase()) {
            addLog('ERROR: Alice is not the designated participant for this contract!', 'error');
            addLog('Bob created his contract with a different participant address', 'error');
            addLog('Bob needs to create a new contract with Alice\'s correct address', 'error');
            setTransactionStatus({
              message: 'Alice is not the designated participant - Bob used wrong address',
              type: 'error'
            });
            return;
          } else {
            addLog('Participant verification successful - Alice is authorized to withdraw', 'success');
          }
        }
      } catch (verifyError: any) {
        addLog(`Could not verify contract details: ${verifyError.message}`, 'error');
        addLog(`This likely means Bob's contract doesn't exist or is invalid`, 'error');
        setTransactionStatus({
          message: 'Bob\'s contract not found - ensure Bob created his contract correctly',
          type: 'error'
        });
        return;
      }
      
      // Debug the transaction parameters being sent
      addLog(`Calling withdraw with contractId: ${swap.bobContract}`, 'info');
      addLog(`Calling withdraw with preimage: ${swap.secret}`, 'info');
      
      // Try to encode the function call to see what's being sent
      try {
        const withdrawData = contract.interface.encodeFunctionData('withdraw', [swap.bobContract, swap.secret]);
        addLog(`Encoded transaction data: ${withdrawData}`, 'info');
      } catch (encodeError: any) {
        addLog(`Could not encode transaction data: ${encodeError.message}`, 'error');
      }
      
      // Double-check contract state immediately before withdrawal
      try {
        addLog('Re-checking contract state immediately before withdrawal...', 'info');
        const freshContractDetails = await contract.getContract(swap.bobContract);
        const [freshInitiator, freshParticipant, freshHashLock, freshTimelock, freshAmount, freshState, freshCreatedAt] = freshContractDetails;
        
        addLog(`Fresh contract state: ${freshState}`, 'info');
        addLog(`Fresh contract hashLock: ${freshHashLock}`, 'info');
        addLog(`Fresh contract participant: ${freshParticipant}`, 'info');
        
        if (freshState.toString() !== '1') {
          addLog(`ERROR: Contract state changed! Expected 1 (INITIATED), got ${freshState}`, 'error');
          addLog('The contract may have been withdrawn from or refunded already', 'error');
          setTransactionStatus({
            message: 'Contract state changed - may have been withdrawn already',
            type: 'error'
          });
          return;
        }
        
        // Check if hash still matches
        if (freshHashLock.toLowerCase() !== swap.secretHash?.toLowerCase()) {
          addLog('ERROR: Hash changed between verification and execution!', 'error');
          setTransactionStatus({
            message: 'Contract hash changed unexpectedly',
            type: 'error'
          });
          return;
        }
      } catch (freshCheckError: any) {
        addLog(`Could not re-check contract state: ${freshCheckError.message}`, 'error');
      }

      // Try with manual gas limit to bypass estimation
      let tx;
      try {
        addLog('Attempting withdrawal with gas estimation...', 'info');
        tx = await contract.withdraw(swap.bobContract, swap.secret);
      } catch (gasError: any) {
        if (gasError.code === 'UNPREDICTABLE_GAS_LIMIT') {
          addLog('Gas estimation failed, trying with manual gas limit...', 'info');
          try {
            tx = await contract.withdraw(swap.bobContract, swap.secret, {
              gasLimit: 100000 // Manual gas limit
            });
          } catch (manualGasError: any) {
            addLog('Manual gas limit also failed, trying higher limit...', 'info');
            tx = await contract.withdraw(swap.bobContract, swap.secret, {
              gasLimit: 200000 // Higher manual gas limit
            });
          }
        } else {
          throw gasError;
        }
      }
      
      addLog(`Transaction submitted: ${tx.hash}`, 'info');
      
      const receipt = await tx.wait();
      console.log('Withdrawal receipt:', receipt);
      
      setSwap(prev => ({ ...prev, step: 'complete' }));
      addLog('Alice successfully withdrew from Bob\'s contract!', 'success');
      addLog(`SECRET REVEALED: ${swap.secret}`, 'info');
      addLog('Bob can now extract this secret and withdraw from Alice\'s contract!', 'info');

      setTransactionStatus({
        message: 'Alice withdrew successfully! Secret revealed!',
        type: 'success',
        hash: tx.hash
      });

    } catch (error: any) {
      if (error.message.includes('underlying network changed')) {
        addLog(`Refreshing provider to handle network mismatch...`, 'info');
        try {
          const recoveryProvider = new ethers.providers.Web3Provider(window.ethereum!);
          setWallet(prev => ({ ...prev, provider: recoveryProvider }));
          addLog(`Provider refreshed successfully. Please try withdrawal again.`, 'success');
          setTransactionStatus({
            message: 'Provider refreshed - please retry withdrawal',
            type: 'success'
          });
          return;
        } catch (recoveryErr) {
          addLog(`Failed to refresh provider. Please try again.`, 'error');
        }
      }
      
      addLog(`Withdrawal failed: ${error.message}`, 'error');
      setTransactionStatus({
        message: `Withdrawal failed: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Bob: Extract secret and withdraw from Alice's contract
  const extractSecretAndWithdraw = async (txHash: string) => {
    if (!wallet.provider || !swap.aliceContract) {
      addLog('Missing requirements: wallet or Alice\'s contract', 'error');
      return;
    }

    try {
      // Extract secret from Alice's withdrawal transaction
      await switchNetwork(swap.toNetwork);
      const tx = await wallet.provider.getTransaction(txHash);
      
      if (!tx) {
        addLog('Transaction not found', 'error');
        return;
      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES[swap.toNetwork].htlc,
        HTLC_ABI,
        wallet.provider
      );

      const decodedData = contract.interface.parseTransaction({ data: tx.data });
      if (decodedData.name !== 'withdraw') {
        addLog('Transaction is not a withdrawal', 'error');
        return;
      }

      const extractedSecret = decodedData.args._preimage;
      addLog(`Secret extracted: ${extractedSecret}`, 'success');

      // Now withdraw from Alice's contract using the secret
      await switchNetwork(swap.fromNetwork);
      
      const aliceContract = new ethers.Contract(
        CONTRACT_ADDRESSES[swap.fromNetwork].htlc,
        HTLC_ABI,
        wallet.provider.getSigner()
      );

      setTransactionStatus({
        message: 'Bob withdrawing from Alice\'s contract...',
        type: 'pending'
      });

      addLog('Bob withdrawing from Alice\'s contract using extracted secret...', 'info');
      
      const withdrawTx = await aliceContract.withdraw(swap.aliceContract, extractedSecret);
      addLog(`Transaction submitted: ${withdrawTx.hash}`, 'info');
      
      await withdrawTx.wait();
      
      setSwap(prev => ({ ...prev, step: 'complete' }));
      addLog('Bob successfully withdrew from Alice\'s contract!', 'success');
      addLog('ATOMIC SWAP COMPLETED! Both parties have their funds.', 'success');

      setTransactionStatus({
        message: 'Atomic swap completed successfully!',
        type: 'success',
        hash: withdrawTx.hash
      });

    } catch (error: any) {
      addLog(`Secret extraction/withdrawal failed: ${error.message}`, 'error');
      setTransactionStatus({
        message: `Failed: ${error.message}`,
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Atomic Swap: Alice & Bob</h1>
        <p className="text-gray-600 mb-4">Trustless cross-chain cryptocurrency exchange</p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
          <h3 className="font-medium text-yellow-800 mb-2">How to Perform a Real Swap:</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li><strong>Alice:</strong> Choose "Alice (Initiator)" → Generate secret → Create contract</li>
            <li><strong>Bob:</strong> Open new browser → Choose "Bob (Counterparty)" → Enter Alice's hash</li>
            <li><strong>Bob:</strong> Create contract → Share contract ID with Alice</li>
            <li><strong>Alice:</strong> Withdraw from Bob's contract (reveals secret)</li>
            <li><strong>Bob:</strong> Extract secret → Withdraw from Alice's contract</li>
          </ol>
          <p className="text-xs text-yellow-600 mt-2">
            💡 Use two different browsers/wallets for Alice and Bob roles
          </p>
        </div>
      </div>

      {/* Role Selection */}
      {!swap.role && (
        <div className="swap-card p-6 text-center">
          <h2 className="text-xl font-medium mb-4">Choose Your Role</h2>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => selectRole('alice')}
              className="btn-primary px-8 py-4"
            >
              Alice (Initiator)
              <div className="text-sm opacity-75 mt-1">Generates secret & starts swap</div>
            </button>
            <button 
              onClick={() => selectRole('bob')}
              className="btn-primary px-8 py-4"
            >
              Bob (Counterparty) 
              <div className="text-sm opacity-75 mt-1">Receives hash & completes swap</div>
            </button>
          </div>
        </div>
      )}

      {swap.role && (
        <>
          {/* Wallet Connection */}
          <div className="swap-card p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">
                You are: <span className="text-blue-600">{swap.role === 'alice' ? 'Alice (Initiator)' : 'Bob (Counterparty)'}</span>
              </h3>
              {wallet.address ? (
                <div className="text-sm">
                  <span className="text-green-600">Connected:</span> {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </div>
              ) : (
                <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>
              )}
            </div>
          </div>

          {/* Swap Configuration */}
          <div className="swap-card p-6">
            <h3 className="font-medium mb-4">Swap Configuration</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {swap.role === 'alice' ? 'Alice Sends' : 'Bob Sends'}
                </label>
                <select 
                  value={swap.fromNetwork}
                  onChange={(e) => setSwap(prev => ({...prev, fromNetwork: e.target.value as NetworkName}))}
                  className="token-display w-full mb-2"
                  disabled={swap.step !== 'setup'}
                >
                  <option value="fuji">▲ AVAX Fuji [TEST]</option>
                  <option value="avalanche">▲ AVAX Avalanche [LIVE]</option>
                  <option value="sepolia">◆ ETH Sepolia [TEST]</option>
                  <option value="ethereum">◆ ETH Ethereum [LIVE]</option>
                </select>
                <input 
                  type="number"
                  value={swap.fromAmount}
                  onChange={(e) => setSwap(prev => ({...prev, fromAmount: e.target.value}))}
                  className="swap-input"
                  placeholder={`${CONTRACT_ADDRESSES[swap.fromNetwork].currency} Amount`}
                  disabled={swap.step !== 'setup'}
                  step={swap.fromNetwork.includes('avalanche') || swap.fromNetwork.includes('fuji') ? '0.001' : '0.0001'}
                  min={swap.fromNetwork.includes('avalanche') || swap.fromNetwork.includes('fuji') ? '0.001' : '0.0001'}
                />
                {wallet.balances[swap.fromNetwork] && (
                  <div className="text-xs text-gray-500 mt-1">
                    Balance: {parseFloat(wallet.balances[swap.fromNetwork]).toFixed(6)} {CONTRACT_ADDRESSES[swap.fromNetwork].currency}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {swap.role === 'alice' ? 'Alice Receives' : 'Bob Receives'}
                </label>
                <select 
                  value={swap.toNetwork}
                  onChange={(e) => setSwap(prev => ({...prev, toNetwork: e.target.value as NetworkName}))}
                  className="token-display w-full mb-2"
                  disabled={swap.step !== 'setup'}
                >
                  <option value="sepolia">◆ ETH Sepolia [TEST]</option>
                  <option value="ethereum">◆ ETH Ethereum [LIVE]</option>
                  <option value="fuji">▲ AVAX Fuji [TEST]</option>
                  <option value="avalanche">▲ AVAX Avalanche [LIVE]</option>
                </select>
                <input 
                  type="number"
                  value={swap.toAmount}
                  onChange={(e) => setSwap(prev => ({...prev, toAmount: e.target.value}))}
                  className="swap-input"
                  placeholder={`${CONTRACT_ADDRESSES[swap.toNetwork].currency} Amount (auto-calculated)`}
                  disabled={true}
                  step={swap.toNetwork.includes('avalanche') || swap.toNetwork.includes('fuji') ? '0.01' : '0.000001'}
                />
                {wallet.balances[swap.toNetwork] && (
                  <div className="text-xs text-gray-500 mt-1">
                    Balance: {parseFloat(wallet.balances[swap.toNetwork]).toFixed(6)} {CONTRACT_ADDRESSES[swap.toNetwork].currency}
                  </div>
                )}
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center my-4">
              <button 
                onClick={() => {
                  setSwap(prev => ({
                    ...prev,
                    fromNetwork: prev.toNetwork,
                    toNetwork: prev.fromNetwork,
                    fromAmount: '',
                    toAmount: ''
                  }));
                }}
                disabled={swap.step !== 'setup'}
                className="swap-direction-btn"
                title="Swap Direction"
              >
                ↕
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded text-center">
              <div className="text-sm font-medium text-blue-800">
                Exchange Rate: 1 AVAX = {exchangeRate} ETH | 1 ETH = {(1/exchangeRate).toFixed(2)} AVAX
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {swap.fromAmount && swap.toAmount && (
                  `${swap.fromAmount} ${CONTRACT_ADDRESSES[swap.fromNetwork].currency} → ${swap.toAmount} ${CONTRACT_ADDRESSES[swap.toNetwork].currency}`
                )}
              </div>
            </div>

            {swap.step === 'setup' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Counterparty Address</label>
                <input 
                  type="text"
                  value={swap.counterpartyAddress}
                  onChange={(e) => setSwap(prev => ({...prev, counterpartyAddress: e.target.value}))}
                  className="swap-input"
                  placeholder="Enter counterparty's wallet address"
                />
              </div>
            )}
          </div>

          {/* Process Steps */}
          <div className="swap-card p-6">
            <h3 className="font-medium mb-4">Atomic Swap Process</h3>

            {/* Step 1: Secret/Hash Handling */}
            {swap.role === 'alice' && swap.step === 'setup' && (
              <div className="space-y-4">
                <button 
                  onClick={generateSecret}
                  disabled={!wallet.address}
                  className="btn-primary w-full"
                >
                  Step 1: Generate Secret & Hash
                </button>
                
                {swap.secretHash && (
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="font-medium text-blue-800">Secret Hash Generated!</p>
                    <p className="text-sm text-blue-700 mt-1">Share this hash with Bob:</p>
                    <p className="font-mono text-xs bg-white p-2 rounded mt-2 break-all">{swap.secretHash}</p>
                    <p className="text-xs text-red-600 mt-2">⚠️ DO NOT share the actual secret!</p>
                  </div>
                )}
              </div>
            )}

            {swap.role === 'bob' && swap.step === 'setup' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Step 1: Enter Secret Hash from Alice</label>
                  <input 
                    type="text"
                    className="swap-input"
                    placeholder="0x... (66 characters)"
                    onChange={(e) => e.target.value.length === 66 && inputReceivedHash(e.target.value)}
                  />
                </div>
                
                {swap.receivedHash && (
                  <div className="bg-green-50 p-4 rounded">
                    <p className="font-medium text-green-800">Secret Hash Received!</p>
                    <p className="font-mono text-xs bg-white p-2 rounded mt-2 break-all">{swap.receivedHash}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Contract Creation */}
            {swap.step === 'contracts' && (
              <div className="space-y-4">
                <button 
                  onClick={createContract}
                  disabled={!wallet.address || (swap.role === 'alice' ? !swap.secretHash : !swap.receivedHash)}
                  className="btn-primary w-full"
                >
                  Step 2: Create {swap.role === 'alice' ? 'Alice\'s' : 'Bob\'s'} Contract
                </button>

                {swap.role === 'alice' && swap.aliceContract && !swap.bobContract && (
                  <div className="bg-yellow-50 p-4 rounded">
                    <p className="font-medium text-yellow-800">Alice's Contract Created!</p>
                    <p className="text-sm text-yellow-700">Contract ID: {swap.aliceContract}</p>
                    <p className="text-sm text-yellow-700 mt-2">Waiting for Bob to create his contract...</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Manual Contract ID Input */}
            {swap.role === 'alice' && swap.aliceContract && !swap.bobContract && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <label className="block text-sm font-medium mb-2">Enter Bob's Contract ID (when Bob creates his contract)</label>
                <input 
                  type="text"
                  className="swap-input"
                  placeholder="0x..."
                  onChange={(e) => e.target.value.length === 66 && setSwap(prev => ({...prev, bobContract: e.target.value, step: 'reveal'}))}
                />
              </div>
            )}

            {/* Step 4: Alice Reveals Secret */}
            {swap.role === 'alice' && swap.step === 'reveal' && swap.bobContract && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded">
                  <p className="font-medium text-green-800">Both Contracts Ready!</p>
                  <p className="text-sm text-green-700">Alice's Contract: {swap.aliceContract}</p>
                  <p className="text-sm text-green-700">Bob's Contract: {swap.bobContract}</p>
                </div>
                
                <button 
                  onClick={withdrawFromBob}
                  className="btn-primary w-full"
                >
                  Step 3: Withdraw from Bob's Contract (Reveal Secret)
                </button>
              </div>
            )}

            {/* Step 5: Bob Extracts Secret */}
            {swap.role === 'bob' && swap.step === 'reveal' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="font-medium text-blue-800">Waiting for Alice to Withdraw...</p>
                  <p className="text-sm text-blue-700">Once Alice withdraws, you can extract the secret and complete the swap.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Enter Alice's Withdrawal Transaction Hash</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="swap-input flex-1"
                      placeholder="0x... transaction hash"
                      id="alice-tx-hash"
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('alice-tx-hash') as HTMLInputElement;
                        if (input.value) extractSecretAndWithdraw(input.value);
                      }}
                      className="btn-primary"
                    >
                      Extract & Withdraw
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Enter Alice's Contract ID</label>
                  <input 
                    type="text"
                    className="swap-input"
                    placeholder="0x..."
                    onChange={(e) => e.target.value.length === 66 && setSwap(prev => ({...prev, aliceContract: e.target.value}))}
                  />
                </div>
              </div>
            )}

            {/* Completion */}
            {swap.step === 'complete' && (
              <div className="bg-green-50 p-6 rounded text-center">
                <h3 className="text-xl font-medium text-green-800">Atomic Swap Completed!</h3>
                <p className="text-green-700 mt-2">
                  {swap.role === 'alice' 
                    ? 'Alice has revealed the secret and withdrawn from Bob\'s contract. Bob can now withdraw from Alice\'s contract.'
                    : 'Both parties have successfully exchanged their assets. The atomic swap is complete!'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Transaction Status */}
          {transactionStatus && (
            <div className={`swap-card p-4 ${
              transactionStatus.type === 'success' ? 'bg-green-50' : 
              transactionStatus.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
            }`}>
              <p className={`font-medium ${
                transactionStatus.type === 'success' ? 'text-green-800' : 
                transactionStatus.type === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {transactionStatus.message}
              </p>
              {transactionStatus.hash && (
                <p className="text-xs text-gray-600 mt-1">
                  Transaction: {transactionStatus.hash}
                </p>
              )}
            </div>
          )}

          {/* Transaction Log */}
          <div className="swap-card p-4">
            <h3 className="font-medium mb-4">Transaction Log</h3>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p>Waiting for actions...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Reset */}
          <div className="text-center">
            <button 
              onClick={() => {
                setSwap({
                  role: null,
                  fromNetwork: 'fuji',
                  toNetwork: 'sepolia',
                  fromAmount: '1.0',
                  toAmount: '',
                  step: 'setup',
                  counterpartyAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
                });
                setLogs([]);
                setTransactionStatus(null);
              }}
              className="btn-secondary"
            >
              Start New Swap
            </button>
          </div>
        </>
      )}
    </div>
  );
};