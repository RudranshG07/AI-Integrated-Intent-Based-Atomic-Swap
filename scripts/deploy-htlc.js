const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying AtomicSwapHTLC...");

  // Get the ContractFactory and Signers here
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const AtomicSwapHTLC = await ethers.getContractFactory("AtomicSwapHTLC");
  const htlc = await AtomicSwapHTLC.deploy();

  await htlc.deployed();

  console.log("AtomicSwapHTLC deployed to:", htlc.address);
  
  // Verify contract balance
  console.log("Contract balance:", (await htlc.getContractBalance()).toString());
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: htlc.address,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };
  
  console.log("\n=== Deployment Info ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Save to file
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}-deployment.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment info saved to deployments/${network.name}-deployment.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });