const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (use database in production)
let intents = [];
let matches = [];

// Network configurations - UPDATED with fresh deployments
const NETWORKS = {
  fuji: {
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    htlcAddress: '0x42bf151c55A03c2659461DC87b8502276dF40be1'  // New deployment 2025-08-10
  },
  sepolia: {
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    htlcAddress: '0x10a02aB3414F907da08165Ba87C3F2cE9aF652E1'   // New deployment 2025-08-10
  }
};

// Helper functions
const generateSwapId = () => {
  return `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateExchangeRate = (fromToken, toToken) => {
  // Simplified exchange rates (use real price feeds in production)
  const rates = {
    'AVAX_ETH': 0.0135,
    'ETH_AVAX': 74.07
  };
  
  const key = `${fromToken}_${toToken}`;
  return rates[key] || 1;
};

const findMatchingIntents = (newIntent) => {
  return intents.filter(intent => 
    intent.id !== newIntent.id &&
    intent.status === 'active' &&
    intent.fromToken === newIntent.toToken &&
    intent.toToken === newIntent.fromToken &&
    intent.fromNetwork === newIntent.toNetwork &&
    intent.toNetwork === newIntent.fromNetwork &&
    Math.abs(parseFloat(intent.fromAmount) - parseFloat(newIntent.toAmount)) < 0.001 // Small tolerance
  );
};

// Routes

// Get all active intents
app.get('/api/intents', (req, res) => {
  const activeIntents = intents.filter(intent => 
    intent.status === 'active' && 
    Date.now() - intent.timestamp < 24 * 60 * 60 * 1000 // 24 hours
  );
  res.json(activeIntents);
});

// Create new intent
app.post('/api/intents', async (req, res) => {
  try {
    const { 
      initiator, 
      fromToken, 
      toToken, 
      fromAmount, 
      fromNetwork, 
      toNetwork,
      userInput 
    } = req.body;

    // Validate required fields
    if (!initiator || !fromToken || !toToken || !fromAmount || !fromNetwork || !toNetwork) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate exchange rate and toAmount
    const exchangeRate = calculateExchangeRate(fromToken, toToken);
    const toAmount = (parseFloat(fromAmount) * exchangeRate).toFixed(6);

    // Generate secret and hash for HTLC
    const secret = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const hashLock = ethers.utils.keccak256(secret);

    const intent = {
      id: generateSwapId(),
      initiator,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      fromNetwork,
      toNetwork,
      status: 'active',
      timestamp: Date.now(),
      userInput,
      secret, // Store securely in production
      hashLock,
      timelock: Math.floor(Date.now() / 1000) + (fromNetwork === 'fuji' ? 7200 : 14400) // 2h for Fuji, 4h for Sepolia
    };

    intents.push(intent);

    // Check for immediate matches
    const potentialMatches = findMatchingIntents(intent);
    
    if (potentialMatches.length > 0) {
      console.log(`Found ${potentialMatches.length} potential matches for intent ${intent.id}`);
    }

    res.json({ 
      success: true, 
      intent,
      potentialMatches: potentialMatches.length 
    });
  } catch (error) {
    console.error('Error creating intent:', error);
    res.status(500).json({ error: 'Failed to create intent' });
  }
});

// Match intents
app.post('/api/intents/:intentId/match', async (req, res) => {
  try {
    const { intentId } = req.params;
    const { matcherAddress } = req.body;

    const intent = intents.find(i => i.id === intentId);
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    if (intent.status !== 'active') {
      return res.status(400).json({ error: 'Intent is not active' });
    }

    if (intent.initiator.toLowerCase() === matcherAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot match your own intent' });
    }

    // Create match
    const match = {
      id: generateSwapId(),
      intentId: intent.id,
      initiator: intent.initiator,
      matcher: matcherAddress,
      status: 'matched',
      timestamp: Date.now(),
      fromToken: intent.fromToken,
      toToken: intent.toToken,
      fromAmount: intent.fromAmount,
      toAmount: intent.toAmount,
      fromNetwork: intent.fromNetwork,
      toNetwork: intent.toNetwork,
      hashLock: intent.hashLock,
      secret: intent.secret, // Share with matcher securely
      timelock: intent.timelock
    };

    matches.push(match);
    
    // Update intent status
    intent.status = 'matched';
    intent.matchedWith = matcherAddress;
    intent.matchId = match.id;

    res.json({ 
      success: true, 
      match,
      intent 
    });
  } catch (error) {
    console.error('Error matching intent:', error);
    res.status(500).json({ error: 'Failed to match intent' });
  }
});

// Get user's intents
app.get('/api/intents/user/:address', (req, res) => {
  const { address } = req.params;
  const userIntents = intents.filter(intent => 
    intent.initiator.toLowerCase() === address.toLowerCase()
  );
  res.json(userIntents);
});

// Get user's matches
app.get('/api/matches/user/:address', (req, res) => {
  const { address } = req.params;
  const userMatches = matches.filter(match => 
    match.initiator.toLowerCase() === address.toLowerCase() ||
    match.matcher.toLowerCase() === address.toLowerCase()
  );
  res.json(userMatches);
});

// Update intent status (for HTLC creation, withdrawal, etc.)
app.patch('/api/intents/:intentId', (req, res) => {
  try {
    const { intentId } = req.params;
    const { status, contractId, txHash } = req.body;

    const intent = intents.find(i => i.id === intentId);
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    // Update intent
    if (status) intent.status = status;
    if (contractId) intent.contractId = contractId;
    if (txHash) intent.txHash = txHash;
    
    intent.updatedAt = Date.now();

    res.json({ success: true, intent });
  } catch (error) {
    console.error('Error updating intent:', error);
    res.status(500).json({ error: 'Failed to update intent' });
  }
});

// Update match with HTLC contract ID
app.patch('/api/matches/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const { contractId, counterpartyContractId, txHash, status } = req.body;

    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update match
    if (contractId) match.contractId = contractId;
    if (counterpartyContractId) match.counterpartyContractId = counterpartyContractId;
    if (txHash) match.txHash = txHash;
    if (status) match.status = status;
    
    match.updatedAt = Date.now();

    res.json({ success: true, match });
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// Clear all intents (for demo/presentation)
app.post('/api/intents/clear', (req, res) => {
  const beforeCount = intents.length;
  const beforeMatches = matches.length;
  
  intents = [];
  matches = [];
  
  console.log(`🧹 Cleared ${beforeCount} intents and ${beforeMatches} matches for fresh demo`);
  
  res.json({
    success: true,
    message: `Cleared ${beforeCount} intents and ${beforeMatches} matches`,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeIntents: intents.filter(i => i.status === 'active').length,
    totalMatches: matches.length
  });
});

// Get network information
app.get('/api/networks', (req, res) => {
  res.json(NETWORKS);
});

// Clean up expired intents (run periodically)
const cleanupExpiredIntents = () => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const beforeCount = intents.length;
  
  intents = intents.filter(intent => intent.timestamp > oneDayAgo);
  matches = matches.filter(match => match.timestamp > oneDayAgo);
  
  if (intents.length !== beforeCount) {
    console.log(`Cleaned up ${beforeCount - intents.length} expired intents`);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredIntents, 60 * 60 * 1000);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Atomic Swap Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Active intents: http://localhost:${PORT}/api/intents`);
});

module.exports = app;