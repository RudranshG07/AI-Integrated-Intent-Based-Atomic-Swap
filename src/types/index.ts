export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  htlcAddress?: string;
}

export interface SwapData {
  contractId: string;
  initiator: string;
  participant: string;
  hashLock: string;
  timelock: number;
  amount: string;
  withdrawn: boolean;
  refunded: boolean;
  preimage?: string;
  network: string;
}

export interface CreateSwapParams {
  participant: string;
  amount: string;
  timelock: number;
  hashLock: string;
  network: string;
}

export interface ClaimSwapParams {
  contractId: string;
  preimage: string;
  network: string;
}

export interface WalletState {
  connected: boolean;
  account: string | null;
  chainId: number | null;
  provider: any;
}