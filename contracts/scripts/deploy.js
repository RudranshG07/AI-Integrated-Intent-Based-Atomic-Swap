const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Deploying Enhanced HTLC contract...");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  // Deploy HTLC contract
  const HTLC = await ethers.getContractFactory("HTLC");
  console.log("Deploying contract...");
  
  const htlc = await HTLC.deploy();
  console.log("Waiting for deployment transaction...");
  
  await htlc.deployed();
  
  console.log("✅ HTLC deployed to:", htlc.address);
  console.log("Transaction hash:", htlc.deployTransaction.hash);
  console.log("Gas used:", htlc.deployTransaction.gasLimit.toString());
  
  // Verify deployment by calling a view function
  try {
    const chainId = await htlc.getChainId();
    console.log("✅ Contract verified - Chain ID:", chainId.toString());
  } catch (error) {
    console.log("❌ Contract verification failed:", error.message);
  }
  
  // Create comprehensive deployment info
  const deploymentInfo = {
    contractName: "HTLC",
    address: htlc.address,
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: htlc.deployTransaction.hash,
    blockNumber: htlc.deployTransaction.blockNumber || 'pending',
    gasLimit: htlc.deployTransaction.gasLimit.toString(),
    gasPrice: htlc.deployTransaction.gasPrice?.toString() || '0',
    features: [
      "Rate limiting",
      "Emergency stop",
      "Enhanced security",
      "Batch operations",
      "Comprehensive events"
    ],
    constants: {
      MIN_TIMELOCK: "1 hour",
      MAX_TIMELOCK: "7 days", 
      SAFETY_BUFFER: "6 hours",
      MAX_SWAPS_PER_USER: 10,
      RATE_LIMIT_WINDOW: "1 day"
    }
  };
  
  // Save deployment info with network-specific naming
  const networkMapping = {
    1: 'ethereum-mainnet',
    11155111: 'ethereum-sepolia', 
    43114: 'avalanche-mainnet',
    43113: 'avalanche-fuji'
  };
  
  const networkName = networkMapping[network.chainId] || `unknown-${network.chainId}`;
  const filename = path.join(__dirname, `../deployments/deployment-${networkName}.json`);
  
  // Ensure deployments directory exists
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to ${filename}`);
  
  // Create a summary for easy reference
  const summary = {
    [networkName]: {
      htlcAddress: htlc.address,
      deployedAt: new Date().toISOString(),
      txHash: htlc.deployTransaction.hash
    }
  };
  
  const summaryFile = path.join(__dirname, '../deployments/summary.json');
  let allDeployments = {};
  
  if (fs.existsSync(summaryFile)) {
    try {
      allDeployments = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    } catch (e) {
      console.log("Creating new summary file...");
    }
  }
  
  allDeployments = { ...allDeployments, ...summary };
  fs.writeFileSync(summaryFile, JSON.stringify(allDeployments, null, 2));
  
  console.log("🎉 Deployment completed successfully!");
  console.log("📋 Summary:");
  console.log(`   Contract: ${htlc.address}`);
  console.log(`   Network: ${networkName}`);
  console.log(`   Chain ID: ${network.chainId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });