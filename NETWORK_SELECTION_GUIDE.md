# Network Selection & Automatic Amount Calculation Guide

## NEW FEATURES ADDED ✅

Your atomic swap interface now includes:
- **Network Selection Dropdowns**: Choose any network for from/to
- **Real-time Exchange Rates**: Live pricing from CoinGecko API
- **Automatic Amount Calculation**: Receive amount updates automatically
- **Smart Network Prevention**: Prevents selecting same network twice

## HOW TO USE THE NEW FEATURES

### 1. **Network Selection**
Each token field now has a dropdown selector:

```
[Amount Input] [▼ ▲ AVAX ▼] <- Click dropdown to change
[Amount Input] [▼ ◆ ETH  ▼] <- Choose from 4 networks
```

**Available Networks:**
- **▲ AVAX** (Avalanche Mainnet - LIVE)
- **◆ ETH** (Ethereum Mainnet - LIVE) 
- **▲ AVAX** (Fuji Testnet - TEST)
- **◆ ETH** (Sepolia Testnet - TEST)

### 2. **Automatic Amount Calculation**
Enter amount in "From" field → "To" amount auto-calculates

```
From: [0.1] [▲ AVAX]
      ↓ (Auto-calculates)
To:   [0.003456] [◆ ETH] (Read-only)
```

**Live Exchange Rate Display:**
```
Rate: 1 AVAX = 0.003456 ETH
```

### 3. **Smart Network Switching**
- If you select same network for both → automatically swaps them
- Prevents invalid same-network swaps
- Maintains balance tracking across all selections

## STEP-BY-STEP USAGE:

### **STEP 1: Select Networks**
1. Click "From" dropdown → Choose source network
2. Click "To" dropdown → Choose destination network  
3. System auto-fetches live exchange rate

### **STEP 2: Enter Amount**
1. Type amount in "From" field
2. "To" amount auto-calculates instantly
3. See live exchange rate below

### **STEP 3: Execute Swap**
1. Click "Initiate Swap" 
2. System uses selected networks automatically
3. MetaMask switches to correct networks

## EXAMPLE SWAP SCENARIOS:

### **Scenario 1: Mainnet AVAX → ETH**
```
From: [0.5] [▲ AVAX] Avalanche Mainnet
To:   [0.017234] [◆ ETH] Ethereum Mainnet  
Rate: 1 AVAX = 0.034468 ETH
Cost: ~$20-35 gas fees
```

### **Scenario 2: Testnet Practice**
```
From: [1.0] [▲ AVAX] Fuji Testnet
To:   [0.034468] [◆ ETH] Sepolia Testnet
Rate: 1 AVAX = 0.034468 ETH  
Cost: FREE (testnet)
```

### **Scenario 3: Cross-Network ETH → AVAX**
```
From: [0.01] [◆ ETH] Ethereum Mainnet
To:   [0.290123] [▲ AVAX] Avalanche Mainnet
Rate: 1 ETH = 29.0123 AVAX
Cost: ~$25-40 gas fees
```

## BALANCE TRACKING:

Your interface shows balances for ALL networks:
```
┌─────────────────────────────────────┐
│ ▲ Avalanche  0.2498 AVAX (active)  │
│ ◆ Ethereum   0.0018 ETH            │  
│ ▲ Fuji       1.8274 AVAX           │
│ ◆ Sepolia    0.0548 ETH            │
└─────────────────────────────────────┘
```

**Balance Features:**
- Real-time updates when you connect
- Shows balance for selected networks
- Updates after transactions complete
- Cross-network visibility

## EXCHANGE RATE FEATURES:

### **Live Pricing**
- Fetches real rates from CoinGecko API
- Updates every time you change networks
- Shows "Loading rate..." during fetch
- Fallback rates if API unavailable

### **Rate Display**
```
Rate: 1 AVAX = 0.034468 ETH
Loading rate... (when fetching)
```

### **Auto-Calculation**
- Type in "From" amount
- "To" amount updates instantly  
- Uses live market rates
- Accurate to 6 decimal places

## SMART FEATURES:

### **Network Collision Prevention**
If you select same network for both:
- System automatically swaps the other network
- Prevents invalid same-to-same swaps
- Maintains logical swap pairs

### **Swap Direction Button**
Click ↕ button to:
- Flip "From" and "To" networks
- Reverse the amounts  
- Recalculate with new exchange rate

### **Read-Only Receive Amount**
- "To" field is read-only (gray background)
- Prevents manual editing
- Always shows calculated amount
- Updates automatically

## TESTING RECOMMENDATIONS:

### **Start with Testnets**
1. Select Fuji → Sepolia networks
2. Use your free testnet tokens
3. Practice the full swap process
4. Learn the interface safely

### **Progress to Mainnet**
1. Start with small amounts (0.01-0.1)
2. Verify exchange rates make sense
3. Check gas cost estimates
4. Execute real swaps

Your atomic swap system now provides complete network flexibility with automatic pricing for seamless cross-chain trading!