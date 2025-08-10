require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [`0x${process.env.AVAX_PRIVATE_KEY || 'e89d3021776fa65a4735381e7341ee4af32f5b46eccbec11d868cdc22b071ebb'}`],
      gasPrice: 25000000000,
      timeout: 60000,
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [`0x${process.env.AVAX_PRIVATE_KEY || 'e89d3021776fa65a4735381e7341ee4af32f5b46eccbec11d868cdc22b071ebb'}`],
      gasPrice: 25000000000,
      timeout: 60000,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || '84f6c260a016475897314b4163130cbb'}`,
      chainId: 11155111,
      accounts: [`0x${process.env.ETH_PRIVATE_KEY || 'd5f74c4d57773c21206a6fb8436e8eb83e29140bfe1958393d7f127882edd175'}`],
      gasPrice: 20000000000,
      timeout: 60000,
    },
    ethereum: {
      url: 'https://eth-mainnet.public.blastapi.io',
      chainId: 1,
      accounts: [`0x${process.env.ETH_PRIVATE_KEY || 'd5f74c4d57773c21206a6fb8436e8eb83e29140bfe1958393d7f127882edd175'}`],
      gasPrice: 'auto',
      timeout: 120000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || 'XSI5UKBAK5HJY6QPS3FBW6WUTY1IT8SKSA',
      sepolia: process.env.ETHERSCAN_API_KEY || 'XSI5UKBAK5HJY6QPS3FBW6WUTY1IT8SKSA',
      avalanche: 'abc123', // Placeholder for Snowtrace
      avalancheFujiTestnet: 'abc123'
    }
  },
  mocha: {
    timeout: 120000
  }
};