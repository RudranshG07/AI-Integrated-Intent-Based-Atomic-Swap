# 🧪 Self-Testing Atomic Swap Guide

## 🎯 What We're Doing
You'll play **both sides** of the swap using your own wallet:
- **Side A**: Lock AVAX on Fuji → Get ETH
- **Side B**: Lock ETH on Sepolia → Get AVAX

## 📋 Step-by-Step Self Test

### **Step 1: Preparation** ⚙️

1. **Open your app**: http://localhost:3000
2. **Connect MetaMask** 
3. **Get your wallet address** from the green testing box
4. **Make sure you have testnet tokens:**
   - **Fuji AVAX**: https://faucet.avax.network/
   - **Sepolia ETH**: https://sepoliafaucet.com/

---

### **Step 2: Create First Swap (AVAX Side)** 🟦

1. **Switch to Fuji Testnet** in MetaMask
2. **Go to "Create Swap" tab**
3. **Click "Generate Secret"** 
   - ⚠️ **SAVE THIS SECRET!** Write it down somewhere safe
   - The app will show something like: `0x1234abcd...`
4. **Fill in the form:**
   - **Network**: Fuji (already selected)
   - **Participant**: Your own address (copy from green testing box)
   - **Amount**: `0.01` (small test amount)
   - **Timelock**: 1 Hour
5. **Click "Create Swap"**
6. **Approve MetaMask transaction**
7. **Save the Contract ID** - you'll need this later!

**✅ Result**: You've locked 0.01 AVAX on Fuji

---

### **Step 3: Create Counter Swap (ETH Side)** 🟩

1. **Switch to Sepolia Testnet** in MetaMask
2. **Go to "Create Swap" tab** 
3. **DON'T generate new secret!** 
4. **Copy the hash from Step 2** (not the secret itself, but the hash)
5. **Fill in the form:**
   - **Network**: Sepolia 
   - **Participant**: Your own address (same as Step 2)
   - **Secret Hash**: Paste the hash from Step 2
   - **Amount**: `0.005` (equivalent ETH amount)
   - **Timelock**: 30 minutes (shorter than first swap)
6. **Click "Create Swap"**
7. **Approve MetaMask transaction**
8. **Save this Contract ID too**

**✅ Result**: You've locked 0.005 ETH on Sepolia

---

### **Step 4: Execute the Atomic Swap** ⚡

**Step 4a: Claim ETH (Reveal Secret)**

1. **Stay on Sepolia Testnet**
2. **Go to "Claim Swap" tab**
3. **Enter:**
   - **Network**: Sepolia
   - **Contract ID**: The Fuji contract ID from Step 2
   - **Secret**: The original secret you saved (the long 0x123... string)
4. **Click "Claim Swap"**
5. **Approve MetaMask transaction**

**✅ Result**: You get 0.005 ETH! Secret is now revealed on blockchain.

---

**Step 4b: Claim AVAX (Use Revealed Secret)**

1. **Switch to Fuji Testnet**
2. **Go to "Claim Swap" tab**
3. **Enter:**
   - **Network**: Fuji
   - **Contract ID**: The Sepolia contract ID from Step 3  
   - **Secret**: The same secret as Step 4a
4. **Click "Claim Swap"**
5. **Approve MetaMask transaction**

**✅ Result**: You get 0.01 AVAX back!

---

## 🎉 **Swap Complete!**

**What just happened:**
- Started: Had AVAX and ETH separately
- Locked: Both tokens in smart contracts
- Swapped: Used secret to unlock both
- Result: **Successfully completed atomic swap!**

**Net result**: You swapped 0.01 AVAX for 0.005 ETH (or vice versa)

---

## 🔍 **How to Monitor Your Test**

### **Use Monitor Tab:**
1. **Enter each Contract ID** to see:
   - Current status
   - Time remaining  
   - Whether it's been claimed
   - Refund options if needed

### **Check Console Logs:**
1. **Open Browser DevTools** (F12)
2. **Look at Console tab**
3. **See detailed transaction logs:**
   ```
   Creating swap with params: {...}
   Transaction sent: 0x...
   Transaction confirmed: {...}
   ```

---

## ⚠️ **If Something Goes Wrong**

### **Transaction Failed?**
- Check console for specific error
- Make sure you have enough tokens + gas
- Verify you're on correct network

### **Can't Find Contract?**
- Double-check Contract ID
- Make sure you're on right network
- Wait a few seconds for blockchain confirmation

### **Wrong Secret?**
- Use the original secret from Step 2
- NOT the hash - the actual secret string

### **Want to Get Money Back?**
- Wait for timelock to expire
- Use "Monitor" tab → "Refund" button

---

## 🧠 **Understanding What Happened**

1. **You created two locks** using the same secret
2. **You revealed the secret** by claiming first swap
3. **You used revealed secret** to claim second swap
4. **Both swaps completed atomically** - no way for either to fail alone

**This proves the atomic swap concept works!** 

In a real swap with another person:
- They would create the counter-swap
- You'd claim their side first (revealing secret)
- They'd see your revealed secret and claim your side
- Both get what they wanted!

---

## 📊 **Track Your Results**

**Before Test:**
- Fuji AVAX: ______
- Sepolia ETH: ______

**After Test:**
- Fuji AVAX: ______ 
- Sepolia ETH: ______

**Contract IDs Used:**
- Fuji Contract: ______
- Sepolia Contract: ______

---

**Ready to try it?** 🚀

Follow these exact steps and you'll complete your first atomic swap! The beauty is you can't lose money - if anything goes wrong, you can always refund after timelock expires.