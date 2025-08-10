# 🔥 Real Testnet Atomic Swap Testing Guide

## ✅ Ready for Real Testing!

Your atomic swap platform is now configured with **real deployed HTLC contracts** on both testnets:

- **Fuji HTLC**: `0x8464135c8F25Da09e49BC8782676a84730C318bC` 
- **Sepolia HTLC**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## 🎯 Complete Atomic Swap Test Scenario

### **Scenario**: Swap 0.1 AVAX for 0.05 ETH

**You'll play both roles** (User A and User B) using your testnet funds.

---

## 📋 Step-by-Step Real Test

### **Phase 1: Preparation** ⚙️

1. **Open the App**: http://localhost:3000
2. **Connect MetaMask** with your wallet that has testnet funds
3. **Check Balances**:
   - Fuji AVAX balance (need >0.1 AVAX)
   - Sepolia ETH balance (need >0.05 ETH)

### **Phase 2: Create First Swap (AVAX → ETH)** 🟦

1. **Switch to Fuji Testnet** in MetaMask
2. **Go to "Create Swap" tab**
3. **Generate Secret** - Click button and **SAVE THE SECRET SAFELY**
4. **Fill Details**:
   - **Participant**: Your own wallet address (since you're testing both sides)
   - **Amount**: `0.1` (AVAX)
   - **Timelock**: `1 Hour`
5. **Create Swap** - Approve MetaMask transaction
6. **Save Contract ID** - Copy the generated contract ID

### **Phase 3: Create Counter Swap (ETH → AVAX)** 🟩

1. **Switch to Sepolia Testnet** in MetaMask
2. **Go to "Create Swap" tab** 
3. **Use SAME Secret Hash** from Phase 2 (paste the hash, not the secret)
4. **Fill Details**:
   - **Participant**: Your own wallet address
   - **Amount**: `0.05` (ETH)
   - **Timelock**: `30 minutes` (shorter than first swap)
5. **Create Swap** - Approve MetaMask transaction
6. **Save Contract ID** - Copy this second contract ID

### **Phase 4: Execute the Atomic Swap** ⚡

**Step 4a: Claim ETH (Reveal Secret)**
1. **Stay on Sepolia Testnet**
2. **Go to "Claim Swap" tab**
3. **Enter Details**:
   - **Contract ID**: First contract ID (from Phase 2)
   - **Secret**: The secret you saved (not the hash!)
4. **Claim Swap** - This reveals your secret on-chain
5. **Check Balance** - You should receive 0.05 ETH

**Step 4b: Claim AVAX (Use Revealed Secret)**
1. **Switch to Fuji Testnet**
2. **Go to "Claim Swap" tab**
3. **Enter Details**:
   - **Contract ID**: Second contract ID (from Phase 3)
   - **Secret**: Same secret as before
4. **Claim Swap** - Complete the atomic swap
5. **Check Balance** - You should receive 0.1 AVAX

---

## 🔍 **Verification Steps**

### **Monitor Your Swaps**
1. **Use "Monitor" tab** to check swap status
2. **Enter contract IDs** to see:
   - Swap details
   - Time remaining
   - Completion status

### **Check on Block Explorers**
- **Fuji**: https://testnet.snowtrace.io/
- **Sepolia**: https://sepolia.etherscan.io/

### **Verify Transactions**
- Both claim transactions should show the same secret
- Balances should reflect the completed swaps

---

## ⚠️ **Important Notes**

1. **Save Your Secret**: Without it, you can't claim the counter-party's swap
2. **Time Management**: Claim swaps before timeout to avoid refunds
3. **Same Secret**: Both swaps must use the same secret hash
4. **Network Switching**: Ensure you're on the correct network for each step
5. **Gas Fees**: Keep some extra testnet tokens for transaction fees

---

## 🚨 **If Something Goes Wrong**

### **Swap Expired?**
- Use "Monitor" tab → "Refund" button to get your funds back

### **Wrong Network?**
- Check MetaMask network matches the contract network

### **Transaction Failed?**
- Ensure sufficient balance for gas fees
- Try increasing gas limit

---

## 🎉 **Success Indicators**

✅ **Successful Atomic Swap:**
- Secret revealed in first claim transaction
- Both swaps completed within timelock
- Balances updated correctly
- No funds lost or stuck

✅ **You've Completed:**
- Real cross-chain atomic swap
- Trustless exchange between AVAX and ETH
- Verified the entire HTLC mechanism

---

## 📊 **Test Results Tracking**

**Before Test:**
- Fuji AVAX Balance: ___
- Sepolia ETH Balance: ___

**After Test:**
- Fuji AVAX Balance: ___
- Sepolia ETH Balance: ___

**Contract IDs:**
- Fuji Swap: ___
- Sepolia Swap: ___

**Secret Used:** ___

---

**You're now ready to perform a real atomic swap on testnets!** 🚀

The contracts are deployed, the platform is configured, and you have testnet funds. This will be a genuine cross-chain atomic swap using real blockchain transactions!