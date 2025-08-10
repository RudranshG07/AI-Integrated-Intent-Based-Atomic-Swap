# 🚀 Simple Atomic Swap Testing Guide

## ✅ Fixed Issues

**MetaMask Problems SOLVED:**
- ✅ Better error messages
- ✅ Network validation
- ✅ Balance checking
- ✅ Gas limit fixes
- ✅ Transaction logging

## 🧪 Easy Testing Steps

### 1. Connect Wallet
- Click "Connect MetaMask"
- Make sure you have testnet tokens:
  - **Fuji AVAX**: Get free tokens at https://faucet.avax.network/
  - **Sepolia ETH**: Get free tokens at https://sepoliafaucet.com/

### 2. Use the Green Testing Helper
The app now shows a **green testing box** with your wallet address - use this to test with yourself!

### 3. Create Your First Swap
- **Network**: Choose Fuji
- **Participant**: Copy your address from the green box
- **Amount**: Start with `0.01` (small test)
- **Click "Generate Secret"** - This creates your secret key
- **Click "Create Swap"** - MetaMask will ask you to approve

### 4. Create Counter Swap  
- **Switch to Sepolia** in MetaMask
- **Use the SAME secret hash** (copy from first swap)
- **Amount**: `0.005` ETH
- **Create second swap**

### 5. Complete the Swaps
- **Claim on Sepolia first** (this reveals your secret)
- **Then claim on Fuji** using the same secret

## 🐛 If MetaMask Transactions Fail

### Check Browser Console
1. Open **Developer Tools** (F12)
2. Look at **Console tab** for error messages
3. You'll see detailed logs now

### Common Fixes
- **"Insufficient funds"**: Get more testnet tokens
- **"Please switch to [Network]"**: Change network in MetaMask
- **"Transaction failed"**: Try increasing gas limit in MetaMask

## 🔍 Debugging Features Added

**Console Logging**: Every transaction now logs:
```
Creating swap with params: { participant, amount, etc }
Transaction sent: 0x...
Transaction confirmed: { receipt details }
```

**Better Error Messages**: Instead of generic errors, you'll see:
- Exact balance amounts
- Network mismatch warnings  
- Clear validation messages

**Network Validation**: App automatically checks you're on the right network

## 🎯 Why Swaps Work Now

**The Problem Was**: 
- Missing gas limits
- No network validation
- Poor error handling
- No balance checks

**The Solution**:
- ✅ Explicit gas limits (300k for create, 200k for claim)
- ✅ Network validation before transactions
- ✅ Balance checking with exact amounts
- ✅ Detailed error messages
- ✅ Console logging for debugging

## 📱 What You'll See

**Success Flow:**
1. Green helper box with your address
2. Clear step-by-step instructions
3. Success alerts with contract IDs
4. Transaction confirmations in console

**If Something Goes Wrong:**
- Red error boxes with specific problems
- Console logs showing exactly what failed
- Suggested fixes for common issues

---

## 🚀 Ready to Test!

Your platform now has:
- **Real HTLC contracts** deployed on testnets
- **Fixed MetaMask integration** 
- **Better user experience**
- **Detailed error handling**
- **Easy testing mode**

**Just refresh your browser and try it now!** The green testing helper will guide you through each step. 🎉