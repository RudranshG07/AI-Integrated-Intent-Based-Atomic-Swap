# Testing Automatic Amount Calculation

## HOW TO TEST THE AUTO-CALCULATION FEATURE

**Visit: http://localhost:3000**

### ✅ **STEP-BY-STEP TEST:**

1. **Connect Your Wallet**
   - Click "Connect Wallet"
   - Approve MetaMask connection
   - You should see all network balances

2. **Test Network Selection**
   - Click dropdown in "From" section → Choose AVAX
   - Click dropdown in "To" section → Choose ETH
   - You should see "Rate: 1 AVAX = 0.013500 ETH" appear

3. **Test Auto-Calculation**
   ```
   Type in From field: 1
   To field should show: 0.013500
   
   Type in From field: 10  
   To field should show: 0.135000
   
   Type in From field: 0.5
   To field should show: 0.006750
   ```

4. **Test Network Switching**
   - Change "From" dropdown to ETH
   - Change "To" dropdown to AVAX  
   - Rate should change to: "1 ETH = 74.000000 AVAX"
   - Type 1 in From → should show 74.000000 in To

5. **Test Direction Swap**
   - Click the ↕ button
   - Networks should flip
   - Amounts should recalculate with new rate

### 🔍 **DEBUGGING TIPS:**

If auto-calculation isn't working:

1. **Check Browser Console** (Press F12)
   ```
   Look for these debug messages:
   - "Fetching exchange rate: {fromCurrency: 'AVAX', toCurrency: 'ETH'}"
   - "Setting exchange rate to: 0.0135"  
   - "From amount changed: 1"
   - "Calculating receive amount: {fromAmount: '1', exchangeRate: 0.0135}"
   - "Setting toAmount to: 0.013500"
   ```

2. **Check Network Selection**
   - Make sure you've selected different currencies (AVAX vs ETH)
   - Same currency won't trigger exchange rate calculation

3. **Refresh Page**
   - Sometimes React state needs a refresh
   - Try refreshing and reconnecting wallet

### 🎯 **EXPECTED BEHAVIOR:**

**When It's Working Correctly:**
- Type in "From" field → "To" field updates instantly
- Change network dropdown → rate updates, amounts recalculate
- Click swap direction → everything flips and recalculates
- "To" field has gray background (read-only)
- Exchange rate shown below "To" field

**Current Exchange Rates (Hardcoded):**
- 1 AVAX = 0.0135 ETH
- 1 ETH = 74.0 AVAX

### 📝 **TEST SCENARIOS:**

**Scenario 1: AVAX → ETH**
```
From: [1.0] [▲ AVAX]
To:   [0.013500] [◆ ETH] (auto-calculated)
Rate: 1 AVAX = 0.013500 ETH
```

**Scenario 2: ETH → AVAX**  
```
From: [0.01] [◆ ETH]
To:   [0.740000] [▲ AVAX] (auto-calculated)  
Rate: 1 ETH = 74.000000 AVAX
```

**Scenario 3: Same Currency (No Calculation)**
```
From: [1.0] [◆ ETH]
To:   [1.000000] [◆ ETH] (rate = 1:1)
Rate: 1 ETH = 1.000000 ETH
```

If the auto-calculation is working, you should see the "To" amount update immediately when you type in the "From" field, and the exchange rate should be displayed below the "To" section.

Check the browser console for debug messages to see what's happening behind the scenes!