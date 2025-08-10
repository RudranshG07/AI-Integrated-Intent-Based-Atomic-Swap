import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

interface PrivateIntent {
  id: string;
  commitment: string; // hash(userAddress + nonce)
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  fromNetwork: string;
  toNetwork: string;
  status: 'pending' | 'committed' | 'matched' | 'executing' | 'completed';
  timestamp: number;
  // Privacy fields
  nonce?: string; // Only known to creator
  secretHash?: string;
  htlcParams?: {
    timelock: number;
    fee: number;
  };
}

interface MatchedPair {
  intentA: PrivateIntent;
  intentB: PrivateIntent;
  sharedSecret: string;
  htlcContracts: {
    chainA?: string;
    chainB?: string;
  };
  status: 'pending' | 'locked' | 'claiming' | 'completed';
}

interface AIIntentSuggestion {
  fromToken: string;
  toToken: string;
  estimatedFromAmount: number;
  estimatedToAmount: number;
  fromNetwork: string;
  toNetwork: string;
  confidence: number;
  reasoning: string;
  optimalParams: {
    slippage: number;
    timelock: number;
    gasFee: number;
  };
}

interface PrivateIntentMatcherProps {
  wallet: {
    address: string | null;
    provider: ethers.providers.Web3Provider | null;
  };
}

export const PrivateIntentMatcher: React.FC<PrivateIntentMatcherProps> = ({ wallet }) => {
  const [userInput, setUserInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<AIIntentSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeIntents, setActiveIntents] = useState<PrivateIntent[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [currentUserIntent, setCurrentUserIntent] = useState<PrivateIntent | null>(null);
  const [logs, setLogs] = useState<Array<{message: string, type: 'info' | 'success' | 'error' | 'warning', timestamp: number}>>([]);
  
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const newLog = { message, type, timestamp: Date.now() };
    setLogs(prev => [...prev, newLog]);
    
    // Auto scroll to bottom
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 100);
  };

  // Simulate AI intent parsing (replace with actual Gemini API call)
  const analyzeUserIntent = async (input: string): Promise<AIIntentSuggestion> => {
    setIsAnalyzing(true);
    addLog(`🤖 AI analyzing intent: "${input}"`, 'info');

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI response (replace with actual Gemini API call)
      const suggestion: AIIntentSuggestion = {
        fromToken: 'AVAX',
        toToken: 'ETH',
        estimatedFromAmount: 0.01,
        estimatedToAmount: 0.000135,
        fromNetwork: 'Avalanche',
        toNetwork: 'Ethereum',
        confidence: 0.95,
        reasoning: 'Detected swap request for 0.01 AVAX to ETH. Current rate: 1 AVAX = 0.0135 ETH. Optimal timelock: 2 hours for cross-chain safety.',
        optimalParams: {
          slippage: 0.005, // 0.5%
          timelock: 7200, // 2 hours in seconds
          gasFee: 0.002
        }
      };

      addLog(`✅ AI Analysis Complete - Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`, 'success');
      addLog(`💡 ${suggestion.reasoning}`, 'info');
      
      return suggestion;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate privacy commitment
  const generateCommitment = (userAddress: string): { commitment: string, nonce: string } => {
    const nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const commitment = ethers.utils.keccak256(
      ethers.utils.solidityPack(['address', 'bytes32'], [userAddress, nonce])
    );
    
    addLog(`🔒 Generated privacy commitment: ${commitment.slice(0, 12)}...`, 'info');
    return { commitment, nonce };
  };

  // Create private intent
  const createPrivateIntent = async () => {
    if (!wallet.address || !aiSuggestion) {
      addLog('❌ Wallet not connected or no AI suggestion', 'error');
      return;
    }

    try {
      const { commitment, nonce } = generateCommitment(wallet.address);
      
      const intent: PrivateIntent = {
        id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        commitment,
        nonce, // Keep locally, don't broadcast
        fromToken: aiSuggestion.fromToken,
        toToken: aiSuggestion.toToken,
        fromAmount: aiSuggestion.estimatedFromAmount,
        toAmount: aiSuggestion.estimatedToAmount,
        fromNetwork: aiSuggestion.fromNetwork,
        toNetwork: aiSuggestion.toNetwork,
        status: 'pending',
        timestamp: Date.now(),
        htlcParams: {
          timelock: aiSuggestion.optimalParams.timelock,
          fee: aiSuggestion.optimalParams.gasFee
        }
      };

      // Add to active intents pool (simulate broadcasting to network)
      setActiveIntents(prev => [...prev, { ...intent, nonce: undefined }]); // Remove nonce from broadcast
      setCurrentUserIntent(intent);
      
      addLog(`📡 Intent broadcasted to pool with ID: ${intent.id.slice(0, 12)}...`, 'success');
      addLog(`🔐 Your identity remains private until matching`, 'info');
      
      // Simulate potential matches
      setTimeout(() => checkForMatches(intent), 3000);
      
    } catch (error) {
      addLog(`❌ Failed to create intent: ${error}`, 'error');
    }
  };

  // Check for potential matches (simulate other users)
  const checkForMatches = async (userIntent: PrivateIntent) => {
    addLog('🔍 Checking for potential matches...', 'info');
    
    // Simulate finding a matching intent
    setTimeout(() => {
      const mockMatchingIntent: PrivateIntent = {
        id: `intent_match_${Date.now()}`,
        commitment: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('mock_commitment')),
        fromToken: userIntent.toToken,
        toToken: userIntent.fromToken,
        fromAmount: userIntent.toAmount,
        toAmount: userIntent.fromAmount,
        fromNetwork: userIntent.toNetwork,
        toNetwork: userIntent.fromNetwork,
        status: 'pending',
        timestamp: Date.now(),
        htlcParams: {
          timelock: 7200,
          fee: 0.002
        }
      };

      addLog(`🎯 Match found! Intent ID: ${mockMatchingIntent.id.slice(0, 12)}...`, 'success');
      addLog(`📋 Counterparty wants: ${mockMatchingIntent.fromAmount} ${mockMatchingIntent.fromToken} → ${mockMatchingIntent.toAmount} ${mockMatchingIntent.toToken}`, 'info');
      
      // Create matched pair
      createMatchedPair(userIntent, mockMatchingIntent);
    }, 2000);
  };

  // Create matched pair and initialize commitment phase
  const createMatchedPair = (intentA: PrivateIntent, intentB: PrivateIntent) => {
    const sharedSecret = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    
    const matchedPair: MatchedPair = {
      intentA,
      intentB,
      sharedSecret,
      htlcContracts: {},
      status: 'pending'
    };

    setMatchedPairs(prev => [...prev, matchedPair]);
    
    addLog('🤝 Match created - entering commitment phase', 'success');
    addLog('⏳ Waiting for both parties to commit...', 'info');
    
    // Auto-commit for demo (in real app, both users need to approve)
    setTimeout(() => commitToMatch(matchedPair), 2000);
  };

  // Commit to match (reveal address and create HTLCs)
  const commitToMatch = async (pair: MatchedPair) => {
    if (!wallet.address || !currentUserIntent?.nonce) return;

    try {
      addLog('🔓 Revealing commitment and creating HTLCs...', 'info');
      
      // In real implementation, both parties reveal their commitments
      const revealedAddress = wallet.address;
      const mockCounterpartyAddress = '0x742d35Cc6635C0532925a3b8D73C0D5B4eb3B6B8';
      
      addLog(`✅ Commitment verified - Your address: ${revealedAddress.slice(0, 8)}...`, 'success');
      addLog(`✅ Counterparty address: ${mockCounterpartyAddress.slice(0, 8)}...`, 'success');
      
      // Generate HTLC secret
      const secret = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      const secretHash = ethers.utils.keccak256(secret);
      
      addLog(`🔑 HTLC secret generated: ${secret.slice(0, 16)}...`, 'info');
      addLog(`🔒 Secret hash: ${secretHash.slice(0, 16)}...`, 'info');
      
      // Simulate HTLC creation on both chains
      const contractA = `0x${Math.random().toString(16).substr(2, 40)}`;
      const contractB = `0x${Math.random().toString(16).substr(2, 40)}`;
      
      pair.htlcContracts = { chainA: contractA, chainB: contractB };
      pair.status = 'locked';
      
      setMatchedPairs(prev => 
        prev.map(p => p === pair ? { ...p, htlcContracts: pair.htlcContracts, status: 'locked' } : p)
      );
      
      addLog(`🔒 HTLC created on ${pair.intentA.fromNetwork}: ${contractA.slice(0, 12)}...`, 'success');
      addLog(`🔒 HTLC created on ${pair.intentB.fromNetwork}: ${contractB.slice(0, 12)}...`, 'success');
      addLog(`💰 Funds locked - you can now claim on either side`, 'info');
      
      // Simulate automatic claiming after timeout
      setTimeout(() => simulateClaim(pair, secret), 5000);
      
    } catch (error) {
      addLog(`❌ Commitment failed: ${error}`, 'error');
    }
  };

  // Simulate claiming (reveals secret)
  const simulateClaim = (pair: MatchedPair, secret: string) => {
    addLog('🎯 Initiating claim on counterparty chain...', 'info');
    
    setTimeout(() => {
      pair.status = 'claiming';
      setMatchedPairs(prev => 
        prev.map(p => p === pair ? { ...p, status: 'claiming' } : p)
      );
      
      addLog(`🔓 SECRET REVEALED ON-CHAIN: ${secret.slice(0, 16)}...`, 'warning');
      addLog('📡 Counterparty can now extract secret and claim their funds', 'info');
      
      // Simulate counterparty claiming
      setTimeout(() => {
        pair.status = 'completed';
        setMatchedPairs(prev => 
          prev.map(p => p === pair ? { ...p, status: 'completed' } : p)
        );
        
        addLog('✅ Swap completed successfully!', 'success');
        addLog('💼 Both parties have received their funds', 'success');
        addLog(`📊 Swap summary: ${pair.intentA.fromAmount} ${pair.intentA.fromToken} ↔ ${pair.intentB.fromAmount} ${pair.intentB.fromToken}`, 'info');
      }, 3000);
    }, 2000);
  };

  const handleAnalyzeIntent = async () => {
    if (!userInput.trim()) return;
    
    const suggestion = await analyzeUserIntent(userInput);
    setAiSuggestion(suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🤖 Private Intent Matcher
          </h1>
          <p className="text-lg text-gray-300">
            AI-Powered Cross-Chain Swaps with Complete Privacy
          </p>
          <div className="mt-4">
            <span className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm">
              🔒 Zero Address Exposure • 🤖 AI Parameter Selection • ⚡ Instant Matching
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Intent Creation */}
          <div className="space-y-6">
            {/* User Input */}
            <div className="bg-black/40 backdrop-blur rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">
                💬 Describe Your Swap Intent
              </h3>
              
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'Swap my 0.01 AVAX to ETH'"
                className="w-full h-24 bg-gray-800 text-white border border-gray-600 rounded-lg p-4 resize-none focus:border-purple-500 focus:outline-none"
              />
              
              <button
                onClick={handleAnalyzeIntent}
                disabled={!userInput.trim() || isAnalyzing}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              >
                {isAnalyzing ? '🤖 Analyzing...' : '🔍 Analyze Intent'}
              </button>
            </div>

            {/* AI Suggestion */}
            {aiSuggestion && (
              <div className="bg-black/40 backdrop-blur rounded-2xl p-6 border border-green-500/30">
                <h3 className="text-xl font-bold text-green-400 mb-4">
                  🤖 AI Suggestion
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400">From</div>
                      <div className="text-lg font-bold text-white">
                        {aiSuggestion.estimatedFromAmount} {aiSuggestion.fromToken}
                      </div>
                      <div className="text-sm text-gray-400">{aiSuggestion.fromNetwork}</div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400">To</div>
                      <div className="text-lg font-bold text-white">
                        {aiSuggestion.estimatedToAmount} {aiSuggestion.toToken}
                      </div>
                      <div className="text-sm text-gray-400">{aiSuggestion.toNetwork}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">AI Reasoning</div>
                    <div className="text-white text-sm">{aiSuggestion.reasoning}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-xs text-gray-400">Slippage</div>
                      <div className="text-white font-semibold">{(aiSuggestion.optimalParams.slippage * 100).toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-xs text-gray-400">Timelock</div>
                      <div className="text-white font-semibold">{aiSuggestion.optimalParams.timelock/3600}h</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-xs text-gray-400">Fee</div>
                      <div className="text-white font-semibold">{aiSuggestion.optimalParams.gasFee} ETH</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={createPrivateIntent}
                    disabled={!wallet.address}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                  >
                    {!wallet.address ? '🔗 Connect Wallet First' : '🚀 Create Private Intent'}
                  </button>
                </div>
              </div>
            )}

            {/* Active Intent Status */}
            {currentUserIntent && (
              <div className="bg-black/40 backdrop-blur rounded-2xl p-6 border border-blue-500/30">
                <h3 className="text-xl font-bold text-blue-400 mb-4">
                  📡 Your Active Intent
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Intent ID:</span>
                    <span className="text-white font-mono text-sm">{currentUserIntent.id.slice(0, 16)}...</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      currentUserIntent.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                      currentUserIntent.status === 'matched' ? 'bg-green-500/20 text-green-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {currentUserIntent.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Privacy:</span>
                    <span className="text-green-300 text-sm">🔒 Address Hidden</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Activity Log */}
          <div className="space-y-6">
            {/* Matched Pairs */}
            {matchedPairs.length > 0 && (
              <div className="bg-black/40 backdrop-blur rounded-2xl p-6 border border-green-500/30">
                <h3 className="text-xl font-bold text-green-400 mb-4">
                  🤝 Matched Swaps
                </h3>
                
                {matchedPairs.map((pair, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4 mb-4 last:mb-0">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm text-gray-400">Swap #{index + 1}</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        pair.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        pair.status === 'locked' ? 'bg-blue-500/20 text-blue-300' :
                        pair.status === 'claiming' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {pair.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-gray-900/50 rounded p-2">
                        <div className="text-xs text-gray-400">You Give</div>
                        <div className="text-white font-semibold">{pair.intentA.fromAmount} {pair.intentA.fromToken}</div>
                      </div>
                      <div className="bg-gray-900/50 rounded p-2">
                        <div className="text-xs text-gray-400">You Get</div>
                        <div className="text-white font-semibold">{pair.intentA.toAmount} {pair.intentA.toToken}</div>
                      </div>
                    </div>
                    
                    {pair.htlcContracts.chainA && (
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="text-gray-400">
                          Chain A Contract: <span className="text-white font-mono">{pair.htlcContracts.chainA?.slice(0, 16)}...</span>
                        </div>
                        <div className="text-gray-400">
                          Chain B Contract: <span className="text-white font-mono">{pair.htlcContracts.chainB?.slice(0, 16)}...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* System Log */}
            <div className="bg-black/40 backdrop-blur rounded-2xl p-6 border border-gray-500/30">
              <h3 className="text-xl font-bold text-white mb-4">
                🖥️ System Log
              </h3>
              
              <div 
                ref={logRef}
                className="bg-gray-900/50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm space-y-2"
              >
                {logs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    Waiting for activity...
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}>
                      <span className="text-gray-500 mr-2">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};