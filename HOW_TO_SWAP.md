# 🔄 How to Execute an Atomic Swap

## 🎯 What is an Atomic Swap?

An atomic swap is a **trustless exchange** between two people on different blockchains. Either **both** people get what they want, or **both** get their money back - no one can cheat!

## 👥 The Players

**Person A (You)**: Has AVAX, wants ETH  
**Person B (Other person)**: Has ETH, wants AVAX

## 📋 Complete Swap Execution

### **Phase 1: Setup** ⚙️

**Person A (You):**
1. Open the app at http://localhost:3000
2. Connect MetaMask with Fuji testnet
3. Make sure you have AVAX (get free tokens at https://faucet.avax.network/)

**Person B:**
1. Opens the same app
2. Connects MetaMask with Sepolia testnet  
3. Makes sure they have ETH (get free tokens at https://sepoliafaucet.com/)

---

### **Phase 2: Create the First Swap** 🟦

**Person A does this:**

1. **Switch to Fuji Testnet** in MetaMask
2. **Go to "Create Swap" tab**
3. **Click "Generate Secret"** → Save this secret safely! 🔑
4. **Fill in details:**
   - **Participant**: Person B's wallet address
   - **Amount**: `0.1` AVAX (or whatever you want to trade)
   - **Timelock**: `2 Hours` (gives Person B time to respond)
5. **Click "Create Swap"** → Approve MetaMask transaction
6. **Copy the Contract ID** → Send this to Person B

**Person A shares with Person B:**
- ✅ Contract ID: `0x123abc...`
- ✅ Secret Hash: `0xdef456...` (NOT the secret itself!)
- ✅ Amount: `0.1 AVAX`
- ✅ Network: `Fuji`

---

### **Phase 3: Create the Counter Swap** 🟩

**Person B does this:**

1. **Switch to Sepolia Testnet** in MetaMask
2. **Go to "Create Swap" tab**  
3. **DON'T generate new secret** - use Person A's hash!
4. **Fill in details:**
   - **Participant**: Person A's wallet address
   - **Secret Hash**: Paste the hash Person A shared
   - **Amount**: `0.05` ETH (agreed equivalent)
   - **Timelock**: `1 Hour` (shorter than Person A's)
5. **Click "Create Swap"** → Approve MetaMask transaction
6. **Copy the Contract ID** → Send this to Person A

**Person B shares with Person A:**
- ✅ Contract ID: `0x789xyz...`
- ✅ Amount: `0.05 ETH` 
- ✅ Network: `Sepolia`

---

### **Phase 4: Execute the Atomic Swap** ⚡

**Step 4a: Person A Claims ETH (Reveals Secret)**

**Person A does this:**
1. **Switch to Sepolia Testnet** in MetaMask
2. **Go to "Claim Swap" tab**
3. **Enter details:**
   - **Contract ID**: Person B's contract ID
   - **Secret**: The original secret you generated (NOT the hash!)
4. **Click "Claim Swap"** → Approve MetaMask transaction
5. **✅ You receive 0.05 ETH!**

**🔥 IMPORTANT: This reveals your secret on the blockchain!**

---

**Step 4b: Person B Claims AVAX (Using Revealed Secret)**

**Person B does this:**
1. **Look at Person A's claim transaction** on Sepolia explorer
2. **Copy the revealed secret** from the transaction data
3. **Switch to Fuji Testnet** in MetaMask  
4. **Go to "Claim Swap" tab**
5. **Enter details:**
   - **Contract ID**: Person A's contract ID  
   - **Secret**: The secret Person A just revealed
6. **Click "Claim Swap"** → Approve MetaMask transaction
7. **✅ You receive 0.1 AVAX!**

---

## 🎉 **Swap Complete!**

**Result:**
- **Person A**: Started with AVAX → Now has ETH ✅
- **Person B**: Started with ETH → Now has AVAX ✅
- **Both happy**: Trustless exchange completed! 🚀

---

## 🔍 **How to Monitor Progress**

### **Use the "Monitor" Tab:**
1. Enter any Contract ID to see:
   - Swap status (Active/Completed/Expired)
   - Time remaining
   - Amount locked
   - Participant addresses

### **Check Block Explorers:**
- **Fuji**: https://testnet.snowtrace.io/
- **Sepolia**: https://sepolia.etherscan.io/

---

## ⚠️ **Safety Features**

### **What if Person B doesn't create counter-swap?**
- Person A can **refund** after timelock expires
- No money lost!

### **What if Person A doesn't claim?**
- Person B can **refund** after their timelock expires  
- Both get money back!

### **What if Person B doesn't claim after Person A reveals secret?**
- Person B loses their chance
- Person A keeps the ETH
- Person B can still refund their side

---

## 🧪 **Testing with Yourself**

**For testing, you can play both roles:**

1. **Create swap on Fuji** (your address as participant)
2. **Create counter-swap on Sepolia** (same secret hash)
3. **Claim on Sepolia** (reveals secret)
4. **Claim on Fuji** (using revealed secret)

**Result**: You swap your own AVAX for ETH! 

---

## 🚨 **Common Issues & Fixes**

### **"Transaction Failed"**
- Check you have enough balance + gas fees
- Make sure you're on the correct network
- Look at browser console for detailed errors

### **"Contract doesn't exist"**  
- Double-check the Contract ID
- Make sure you're on the right network

### **"Hash doesn't match"**
- Person B must use Person A's EXACT secret hash
- Don't generate a new secret for counter-swap

### **"Timelock expired"**
- Use the "Monitor" tab to check timelock
- Click "Refund" to get money back

---

## 🎯 **Key Success Tips**

1. **Communication**: Both parties must share Contract IDs and details
2. **Timing**: Person A claims first, Person B follows quickly  
3. **Same Secret**: Both swaps must use the same secret hash
4. **Network Switching**: Make sure you're on the correct blockchain
5. **Save Everything**: Keep Contract IDs and secrets safe!

---

**Ready to try your first atomic swap?** 🚀

The magic happens when Person A reveals the secret - that's when the atomic swap becomes unstoppable! ⚡