# Wallet Connection Troubleshooting Guide

## WALLET NOT CONNECTING? 

### 1. Check MetaMask Installation
- Open your browser
- Go to: http://localhost:3000
- Look at the "MetaMask Status" section
- If shows "Not Found" → Install MetaMask

### 2. Install MetaMask (if needed)
- Visit: https://metamask.io/download/
- Install the browser extension
- Create or import your wallet
- Refresh the page at http://localhost:3000

### 3. Check Browser Console
Press F12 → Console tab, look for errors:

**Common Errors & Fixes:**
- `ethereum is undefined` → MetaMask not installed
- `User rejected request` → Click "Connect" in MetaMask
- `Already processing` → Wait or refresh page

### 4. MetaMask Connection Steps
1. Click "Connect Wallet" button
2. MetaMask popup should appear
3. Click "Next" then "Connect"
4. Allow the connection

### 5. If Still Not Working

#### Try These Steps:
```bash
# Kill all processes and restart
killall -9 node
npm start
```

#### Check MetaMask:
1. Open MetaMask extension
2. Go to Settings → Advanced
3. Reset Account (if needed)
4. Try connecting again

#### Browser Issues:
- Try incognito/private mode
- Disable other wallet extensions
- Clear browser cache
- Try different browser

### 6. Test Connection Manually

Open browser console (F12) and run:
```javascript
// Check if MetaMask exists
console.log('MetaMask detected:', typeof window.ethereum !== 'undefined');

// Test connection
window.ethereum.request({ method: 'eth_requestAccounts' })
  .then(accounts => console.log('Accounts:', accounts))
  .catch(error => console.error('Error:', error));
```

### 7. Your Wallet Addresses
Make sure you're using the correct accounts:
- **Ethereum**: 0x2A185AB92F0e095299584122B12D1aa752C34C3a
- **Avalanche**: 0x17aA793f91d1c0624F119D7cAC46BF1054c42b0D

### 8. Network Issues
If connected but wrong network:
1. Click the network dropdown in MetaMask
2. Add custom networks if needed:
   - **Avalanche**: Chain ID 43114
   - **Fuji**: Chain ID 43113

### 9. Still Not Working?

#### Debug Information Needed:
1. Browser name and version
2. MetaMask version
3. Console error messages
4. Screenshot of the interface

#### Quick Fix Attempts:
1. Refresh the page
2. Disconnect and reconnect MetaMask
3. Restart browser
4. Try different browser

The wallet connection should work immediately once MetaMask is properly installed and the page is refreshed.