# 🔐 How the HTLC Smart Contract Works

## 📋 Contract Components

### **Swap Structure (Lines 5-14)**
```solidity
struct Swap {
    address payable initiator;    // Person who locks funds
    address payable participant;  // Person who can claim funds
    bytes32 hashLock;            // Hash of the secret
    uint256 timelock;            // Expiration time
    uint256 amount;              // Amount locked
    bool withdrawn;              // Has been claimed?
    bool refunded;               // Has been refunded?
    bool active;                 // Is contract active?
}
```

## 🔄 **Complete Swap Flow**

### **Phase 1: Alice Creates First Lock (Fuji Network)**

**Function Called:** `newContract()` (Lines 65-102)

**What Happens:**
1. **Alice calls**: `newContract(Bob's_address, secret_hash, timelock)`
2. **Alice sends**: 0.1 AVAX with the transaction
3. **Contract generates**: Unique contract ID using:
   ```solidity
   contractId = keccak256(
       Alice_address,
       Bob_address, 
       secret_hash,
       timelock,
       0.1_AVAX,
       current_timestamp
   )
   ```
4. **Contract stores**: All swap data in `swaps[contractId]`
5. **Contract emits**: `HTLCNew` event with contract details

**Result**: Alice's 0.1 AVAX is locked, only Bob can claim it with the secret

---

### **Phase 2: Bob Creates Counter Lock (Sepolia Network)**

**Function Called:** `newContract()` (Same contract, different network)

**What Happens:**
1. **Bob calls**: `newContract(Alice's_address, SAME_secret_hash, shorter_timelock)`
2. **Bob sends**: 0.05 ETH with the transaction  
3. **Contract generates**: Different contract ID (different network/timestamp)
4. **Contract stores**: Bob's swap data

**Result**: Bob's 0.05 ETH is locked, only Alice can claim it with the same secret

---

### **Phase 3: Alice Claims ETH (Reveals Secret)**

**Function Called:** `withdraw()` (Lines 104-116)

**What Happens:**
1. **Alice calls**: `withdraw(Bob's_contractId, secret)`
2. **Contract validates** (Lines 106-108):
   - Contract exists? ✓
   - `sha256(secret) == stored_hash`? ✓  
   - Is Alice the participant? ✓
   - Is timelock still valid? ✓
   - Not already withdrawn? ✓
3. **If valid**:
   - Sets `withdrawn = true`
   - Transfers 0.05 ETH to Alice
   - Emits `HTLCWithdraw` event

**🔥 CRITICAL**: The secret is now visible on blockchain in the transaction data!

---

### **Phase 4: Bob Claims AVAX (Uses Revealed Secret)**

**Function Called:** `withdraw()` (Same function, Fuji network)

**What Happens:**
1. **Bob sees** Alice's transaction on Sepolia explorer
2. **Bob extracts** the secret from Alice's transaction data
3. **Bob calls**: `withdraw(Alice's_contractId, extracted_secret)`
4. **Contract validates** the same conditions
5. **Contract transfers** 0.1 AVAX to Bob

**Result**: Atomic swap complete! Both got what they wanted.

---

## 🔒 **Security Features**

### **Hash Lock Validation (Line 46)**
```solidity
require(swaps[_contractId].hashLock == sha256(abi.encodePacked(_x)), "Hashlock does not match");
```
- Only the correct secret can unlock funds
- SHA-256 ensures cryptographic security

### **Authorization Check (Line 51)**
```solidity
require(swaps[_contractId].participant == msg.sender, "Not authorized");
```
- Only the designated participant can claim
- Prevents theft by other addresses

### **Time Lock Protection (Line 53)**
```solidity
require(swaps[_contractId].timelock > block.timestamp, "Timelock expired");
```
- Must claim before expiration
- Prevents indefinite locks

### **Refund Mechanism (Lines 118-129)**
```solidity
function refund(bytes32 _contractId) external {
    require(swaps[_contractId].initiator == msg.sender, "Not authorized");
    require(swaps[_contractId].timelock <= block.timestamp, "Timelock not yet passed");
    // ... refund logic
}
```
- Original sender can get funds back after timelock expires
- Only if not already withdrawn

## ⚡ **Atomic Properties**

### **Why It's "Atomic":**

1. **Alice must reveal secret first** to get Bob's ETH
2. **Once secret is revealed**, Bob can always claim Alice's AVAX
3. **If Alice doesn't reveal**, both can refund after timelock
4. **No scenario exists** where only one person benefits

### **Fail-Safe Scenarios:**

**Scenario 1: Happy Path**
- Alice claims → Secret revealed → Bob claims → Both happy ✅

**Scenario 2: Alice Doesn't Claim**
- Timelock expires → Both refund their own funds → No loss ✅

**Scenario 3: Bob Doesn't Claim After Alice**
- Alice keeps the ETH → Bob can still refund AVAX → Alice benefits more, but Bob doesn't lose ✅

**Scenario 4: Contract Bug/Issue**
- Refund mechanism always available after timelock → Funds never permanently lost ✅

## 🎯 **Key Contract Features**

### **Unique Contract IDs (Lines 70-79)**
- Each swap gets unique ID based on all parameters
- Prevents replay attacks and collisions

### **Event Logging (Lines 18-28)**
- All actions emit events for easy tracking
- Frontend can monitor contract state changes

### **State Management**
- `withdrawn` and `refunded` prevent double-spending
- `active` flag tracks contract lifecycle

### **Gas Optimization**
- Efficient storage packing
- Minimal external calls
- Clear separation of concerns

## 🔍 **In Your App**

**When you call "Create Swap":**
- Calls `newContract()` 
- Your AVAX/ETH gets locked in contract
- Returns contract ID for tracking

**When you call "Claim Swap":**
- Calls `withdraw(contractId, secret)`
- Validates secret matches hash
- Transfers locked funds to you

**When you call "Refund":**
- Calls `refund(contractId)`
- Only works after timelock expires
- Returns your original funds

---

## 🚀 **Why This Design Works**

1. **Trustless**: No middleman needed
2. **Secure**: Cryptographic hash locks
3. **Time-bounded**: Automatic refunds prevent stuck funds  
4. **Transparent**: All actions visible on blockchain
5. **Cross-chain**: Same contract works on any EVM chain

**Your HTLC contract implements a proven atomic swap mechanism used by major protocols!** 🎉