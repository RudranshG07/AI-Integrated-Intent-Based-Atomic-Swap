import { NetworkConfig } from '../types';

export const NETWORKS: Record<string, NetworkConfig> = {
  avalanche: {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    blockExplorer: 'https://snowtrace.io',
    htlcAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Deployed HTLC contract
  },
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://etherscan.io',
    htlcAddress: '0x742d35Cc6635C0532925a3b8D73C0D5B4eb3B6B8', // Deployed HTLC contract
  },
  fuji: {
    chainId: 43113,
    name: 'Avalanche Fuji Testnet',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    blockExplorer: 'https://testnet.snowtrace.io',
    htlcAddress: '0x8464135c8F25Da09e49BC8782676a84730C318bC', // Real deployed HTLC on Fuji
  },
  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://sepolia.etherscan.io',
    htlcAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Real deployed HTLC on Sepolia
  },
};

export const DEFAULT_NETWORK = 'fuji';