# 🤖 AI Intent-Based Atomic Swap DApp

An AI-powered decentralized application that enables trustless cross-chain atomic swaps using natural language processing. Simply type "I want to swap 1 AVAX for ETH" and let AI handle the rest!

## 🌟 Features

- **🤖 AI-Powered Intent Generation**: Type natural language like "I want to swap 1 AVAX for ETH" 
- **⛓️ Trustless Cross-Chain Swaps**: Direct Avalanche ↔ Ethereum swaps using HTLCs
- **🎯 Intent-Based Matching**: Real-time marketplace matching complementary swap intentions
- **🔒 Enterprise Security**: Rate limiting, emergency stops, and unhackable architecture  
- **✨ Professional UX**: Success animations, live updates, and MetaMask integration
- **🌐 Testnet Support**: Full testing on Fuji (Avalanche) and Sepolia (Ethereum) testnets

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- MetaMask wallet
- Test tokens for testnets (AVAX on Fuji, ETH on Goerli)

### Installation

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your RPC URLs and contract addresses

# Start development server
npm start
```

### Smart Contract Deployment

```bash
# Navigate to contracts directory
cd contracts

# Install Hardhat dependencies (if not already done)
npm install hardhat @nomiclabs/hardhat-ethers ethers

# Deploy to Fuji testnet
npx hardhat run scripts/deploy.js --network fuji

# Deploy to Sepolia testnet  
npx hardhat run scripts/deploy.js --network sepolia

# Update contract addresses in your .env file
```

## 📋 How It Works

### Creating a Swap

1. **Generate Secret**: Click "Generate Secret" to create a unique secret key
2. **Enter Details**: Fill in participant address, amount, and timelock
3. **Deploy Contract**: Submit transaction to create HTLC on your network
4. **Share Info**: Send contract ID and hash to the other party

### Claiming a Swap

1. **Get Contract ID**: Receive contract ID from swap initiator
2. **Monitor**: Wait for initiator to claim their side (revealing the secret)
3. **Extract Secret**: Copy the secret from the initiator's claim transaction
4. **Claim Funds**: Use the secret to claim your funds before timeout

## 🔧 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Blockchain**: Solidity 0.8.19, Hardhat
- **Web3**: ethers.js v5
- **Deployment**: Vercel
- **Networks**: Avalanche C-Chain, Ethereum

## 🏗️ Architecture

```
├── src/
│   ├── components/         # React components
│   ├── services/           # Web3 integration
│   ├── types/              # TypeScript definitions
│   └── config/             # Network configurations
├── contracts/              # Smart contracts
│   ├── HTLC.sol           # Hash Time-Locked Contract
│   └── hardhat.config.js   # Hardhat configuration
└── public/                # Static assets
```

## 🔐 Security Features

- **Time Locks**: Automatic refunds prevent permanent fund loss
- **Hash Locks**: Cryptographic security using SHA-256
- **Input Validation**: Comprehensive parameter checking
- **Error Handling**: Graceful handling of edge cases
- **Audit Ready**: Clean, well-documented smart contracts

## 🧪 Testing

The application includes comprehensive testing on both testnets:

- **Fuji Testnet**: Avalanche's official testnet
- **Sepolia Testnet**: Ethereum's official testnet

Get test tokens:
- Fuji AVAX: https://faucet.avax.network/
- Sepolia ETH: https://sepoliafaucet.com/

## 📊 Supported Networks

### Mainnet
- Avalanche C-Chain (ChainID: 43114)
- Ethereum Mainnet (ChainID: 1)

### Testnet
- Avalanche Fuji (ChainID: 43113)
- Ethereum Sepolia (ChainID: 11155111)

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm run build`
Builds the app for production to the `build` folder

### `npm test`
Launches the test runner in interactive watch mode

## ⚠️ Important Notes

- Always test with small amounts first
- Keep your secret key secure and never share publicly
- Monitor swaps closely to avoid missing claim windows
- Double-check all addresses and amounts before creating swaps
- Use testnets for learning and development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
