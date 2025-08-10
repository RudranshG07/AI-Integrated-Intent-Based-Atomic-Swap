export const CONTRACT_ADDRESSES = {
  // Mainnet contracts
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    htlc: '0xCAE806c48DB297B06c3Ad9495095FE0FC1eaa71a',
    currency: 'ETH',
    rpcUrl: 'https://eth-mainnet.public.blastapi.io',
    explorerUrl: 'https://etherscan.io'
  },
  avalanche: {
    chainId: 43114,
    name: 'Avalanche',
    htlc: '0xE4843c1dFb366e59C694317165B2BaCA654E04a6',
    currency: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io'
  },
  
  // Testnet contracts
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    htlc: '0x4005f23BD3054D8F1e3583F78C7f2fbf38AE1482',
    currency: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/84f6c260a016475897314b4163130cbb',
    explorerUrl: 'https://sepolia.etherscan.io'
  },
  fuji: {
    chainId: 43113,
    name: 'Fuji',
    htlc: '0xE4843c1dFb366e59C694317165B2BaCA654E04a6',
    currency: 'AVAX',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io'
  }
} as const;

export const HTLC_ABI = [
  "function newContract(address payable _participant, bytes32 _hashLock, uint256 _timelock) external payable returns (bytes32)",
  "function withdraw(bytes32 _contractId, bytes32 _preimage) external returns (bool)",
  "function refund(bytes32 _contractId) external returns (bool)",
  "function getContract(bytes32 _contractId) external view returns (address initiator, address participant, bytes32 hashLock, uint256 timelock, uint256 amount, uint8 state, uint256 createdAt)",
  "function getContractStatus(bytes32 _contractId) external view returns (uint8 state, uint256 timeRemaining, bool isExpired)",
  "function batchRefund(bytes32[] calldata _contractIds) external",
  "function getChainId() external view returns (uint256)",
  "function emergencyStop() external view returns (bool)",
  "function owner() external view returns (address)",
  "function toggleEmergencyStop() external",
  "function userSwapCount(address user) external view returns (uint256)",
  "function lastSwapTime(address user) external view returns (uint256)",
  "function MAX_SWAPS_PER_USER() external view returns (uint256)",
  "function RATE_LIMIT_WINDOW() external view returns (uint256)",
  "event SwapInitiated(bytes32 indexed contractId, address indexed initiator, address indexed participant, bytes32 hashLock, uint256 timelock, uint256 amount, uint256 createdAt)",
  "event SwapWithdrawn(bytes32 indexed contractId, bytes32 secret, uint256 withdrawnAt)",
  "event SwapRefunded(bytes32 indexed contractId, uint256 refundedAt)",
  "event SwapStateChanged(bytes32 indexed contractId, uint8 oldState, uint8 newState, uint256 timestamp)",
  "event EmergencyStopToggled(bool stopped, uint256 timestamp)"
] as const;

export const SWAP_STATES = {
  EMPTY: 0,
  INITIATED: 1,
  PARTICIPATED: 2,
  WITHDRAWN: 3,
  REFUNDED: 4
} as const;

export type NetworkName = keyof typeof CONTRACT_ADDRESSES;
export type ContractInfo = typeof CONTRACT_ADDRESSES[NetworkName];