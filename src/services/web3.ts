import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';
import { NetworkConfig, WalletState, SwapData, CreateSwapParams, ClaimSwapParams } from '../types';

const HTLC_ABI = [
  "function newContract(address payable _participant, bytes32 _hashLock, uint256 _timelock) external payable returns (bytes32)",
  "function withdraw(bytes32 _contractId, bytes32 _preimage) external returns (bool)",
  "function refund(bytes32 _contractId) external returns (bool)",
  "function getContract(bytes32 _contractId) public view returns (address, address, bytes32, uint256, uint256, bool, bool)",
  "event HTLCNew(bytes32 indexed contractId, address indexed initiator, address indexed participant, bytes32 hashLock, uint256 timelock, uint256 amount)",
  "event HTLCWithdraw(bytes32 indexed contractId)",
  "event HTLCRefund(bytes32 indexed contractId)"
];

export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;

  async connectWallet(): Promise<WalletState> {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    const network = await provider.getNetwork();

    this.provider = provider;
    this.signer = signer;

    return {
      connected: true,
      account,
      chainId: network.chainId,
      provider
    };
  }

  async switchNetwork(networkKey: string): Promise<void> {
    const network = NETWORKS[networkKey];
    if (!network || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await this.addNetwork(network);
      }
    }
  }

  private async addNetwork(network: NetworkConfig): Promise<void> {
    if (!window.ethereum) return;

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${network.chainId.toString(16)}`,
        chainName: network.name,
        rpcUrls: [network.rpcUrl],
        nativeCurrency: network.nativeCurrency,
        blockExplorerUrls: [network.blockExplorer],
      }],
    });
  }

  generateSecret(): { secret: string; hash: string } {
    const secret = ethers.utils.randomBytes(32);
    const secretHex = ethers.utils.hexlify(secret);
    const hash = ethers.utils.sha256(secretHex);
    
    return {
      secret: secretHex,
      hash
    };
  }

  async createSwap(params: CreateSwapParams): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const network = NETWORKS[params.network];
    if (!network.htlcAddress) throw new Error('HTLC contract not deployed on this network');

    // Check if we're on the right network
    const currentNetwork = await this.provider?.getNetwork();
    if (currentNetwork?.chainId !== network.chainId) {
      throw new Error(`Please switch to ${network.name} in MetaMask`);
    }

    const contract = new ethers.Contract(network.htlcAddress, HTLC_ABI, this.signer);
    
    const timelock = Math.floor(Date.now() / 1000) + params.timelock;
    const amount = ethers.utils.parseEther(params.amount);

    // Check balance before transaction
    const balance = await this.signer.getBalance();
    if (balance.lt(amount)) {
      throw new Error(`Insufficient balance. You have ${ethers.utils.formatEther(balance)} ${network.nativeCurrency.symbol}`);
    }

    console.log('Creating swap with params:', {
      participant: params.participant,
      hashLock: params.hashLock,
      timelock,
      amount: params.amount
    });

    const tx = await contract.newContract(
      params.participant,
      params.hashLock,
      timelock,
      { 
        value: amount,
        gasLimit: 300000 // Explicit gas limit
      }
    );

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    const event = receipt.events?.find((e: any) => e.event === 'HTLCNew');
    
    if (!event) {
      throw new Error('Swap creation failed - no event emitted');
    }
    
    return event.args.contractId;
  }

  async claimSwap(params: ClaimSwapParams): Promise<boolean> {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const network = NETWORKS[params.network];
    if (!network.htlcAddress) throw new Error('HTLC contract not deployed on this network');

    // Check if we're on the right network
    const currentNetwork = await this.provider?.getNetwork();
    if (currentNetwork?.chainId !== network.chainId) {
      throw new Error(`Please switch to ${network.name} in MetaMask`);
    }

    const contract = new ethers.Contract(network.htlcAddress, HTLC_ABI, this.signer);
    
    console.log('Claiming swap with params:', {
      contractId: params.contractId,
      preimage: params.preimage
    });
    
    const tx = await contract.withdraw(params.contractId, params.preimage, {
      gasLimit: 200000 // Explicit gas limit
    });
    
    console.log('Claim transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Claim transaction confirmed:', receipt);
    
    return true;
  }

  async refundSwap(contractId: string, networkKey: string): Promise<boolean> {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const network = NETWORKS[networkKey];
    if (!network.htlcAddress) throw new Error('HTLC contract not deployed on this network');

    const contract = new ethers.Contract(network.htlcAddress, HTLC_ABI, this.signer);
    
    const tx = await contract.refund(contractId);
    await tx.wait();
    
    return true;
  }

  async getSwapDetails(contractId: string, networkKey: string): Promise<SwapData | null> {
    const network = NETWORKS[networkKey];
    if (!network.htlcAddress) return null;

    const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
    const contract = new ethers.Contract(network.htlcAddress, HTLC_ABI, provider);
    
    try {
      const [initiator, participant, hashLock, timelock, amount, withdrawn, refunded] = 
        await contract.getContract(contractId);
      
      if (initiator === ethers.constants.AddressZero) return null;

      return {
        contractId,
        initiator,
        participant,
        hashLock,
        timelock: timelock.toNumber(),
        amount: ethers.utils.formatEther(amount),
        withdrawn,
        refunded,
        network: networkKey
      };
    } catch (error) {
      return null;
    }
  }

  async monitorSwapEvents(networkKey: string, callback: (event: any) => void): Promise<void> {
    const network = NETWORKS[networkKey];
    if (!network.htlcAddress) return;

    const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
    const contract = new ethers.Contract(network.htlcAddress, HTLC_ABI, provider);

    contract.on('HTLCNew', callback);
    contract.on('HTLCWithdraw', callback);
    contract.on('HTLCRefund', callback);
  }
}

export const web3Service = new Web3Service();