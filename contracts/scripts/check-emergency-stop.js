const { ethers } = require("hardhat");

// Contract addresses
const CONTRACTS = {
  ethereum: '0xCAE806c48DB297B06c3Ad9495095FE0FC1eaa71a',
  avalanche: '0xE4843c1dFb366e59C694317165B2BaCA654E04a6',
  sepolia: '0x4005f23BD3054D8F1e3583F78C7f2fbf38AE1482',
  fuji: '0xE4843c1dFb366e59C694317165B2BaCA654E04a6'
};

async function checkEmergencyStop() {
  console.log("Checking emergency stop status on all networks...\n");

  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Current network:", network.name, "Chain ID:", network.chainId);
  console.log("Signer address:", signer.address);
  
  // Get contract instance
  let contractAddress;
  if (network.chainId === 1) contractAddress = CONTRACTS.ethereum;
  else if (network.chainId === 43114) contractAddress = CONTRACTS.avalanche;
  else if (network.chainId === 11155111) contractAddress = CONTRACTS.sepolia;
  else if (network.chainId === 43113) contractAddress = CONTRACTS.fuji;
  else {
    console.log("Unknown network");
    return;
  }
  
  console.log("Contract address:", contractAddress);
  
  const HTLC = await ethers.getContractFactory("HTLC");
  const contract = HTLC.attach(contractAddress);
  
  try {
    // Check emergency stop status
    const emergencyStop = await contract.emergencyStop();
    const owner = await contract.owner();
    
    console.log("\n=== Contract Status ===");
    console.log("Emergency Stop:", emergencyStop ? "ENABLED (BLOCKING SWAPS)" : "DISABLED (SWAPS ALLOWED)");
    console.log("Contract Owner:", owner);
    console.log("Current Signer:", signer.address);
    console.log("Is Owner?", owner.toLowerCase() === signer.address.toLowerCase());
    
    if (emergencyStop) {
      console.log("\n⚠️  EMERGENCY STOP IS ENABLED - This prevents all swaps!");
      
      if (owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log("✅ You are the owner - you can disable it");
        
        console.log("\nDisabling emergency stop...");
        const tx = await contract.toggleEmergencyStop();
        console.log("Transaction hash:", tx.hash);
        
        console.log("Waiting for confirmation...");
        await tx.wait();
        
        // Check status again
        const newStatus = await contract.emergencyStop();
        console.log("✅ Emergency stop is now:", newStatus ? "ENABLED" : "DISABLED");
        
        if (!newStatus) {
          console.log("🎉 SUCCESS: Swaps are now allowed!");
        }
      } else {
        console.log("❌ You are not the owner - cannot disable emergency stop");
        console.log("Owner address:", owner);
        console.log("Your address:", signer.address);
      }
    } else {
      console.log("✅ Emergency stop is disabled - swaps should work normally");
    }
    
  } catch (error) {
    console.error("Error checking contract:", error.message);
  }
}

checkEmergencyStop()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });