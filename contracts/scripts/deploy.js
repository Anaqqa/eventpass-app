const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EventPass contract...");

  const EventPass = await hre.ethers.getContractFactory("EventPass");
  const eventPass = await EventPass.deploy();

  await eventPass.waitForDeployment();

  const address = await eventPass.getAddress();
  
  console.log("✅ EventPass deployed to:", address);
  console.log("\n📋 Contract Details:");
  console.log("   - Early Bird Price:", hre.ethers.formatEther(await eventPass.ticketPrices(0)), "ETH");
  console.log("   - Standard Price:", hre.ethers.formatEther(await eventPass.ticketPrices(1)), "ETH");
  console.log("   - Premium Price:", hre.ethers.formatEther(await eventPass.ticketPrices(2)), "ETH");
  console.log("   - VIP Price:", hre.ethers.formatEther(await eventPass.ticketPrices(3)), "ETH");
  
  console.log("\n🔧 Save this address to your frontend .env:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
