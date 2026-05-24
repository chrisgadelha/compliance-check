import { ethers } from "hardhat";

/**
 * Deploys ComplianceLog to whichever network Hardhat is pointed at.
 * Run with: npx hardhat run scripts/deploy.ts --network celo
 *
 * After deployment, paste the printed address into packages/react-app/.env.local
 * as NEXT_PUBLIC_CONTRACT_ADDRESS, then verify with:
 *   npx hardhat verify --network celo <ADDRESS>
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance (CELO):", ethers.formatEther(balance));

  const ComplianceLog = await ethers.getContractFactory("ComplianceLog");
  const contract = await ComplianceLog.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ComplianceLog deployed to:", address);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Set NEXT_PUBLIC_CONTRACT_ADDRESS=${address} in packages/react-app/.env.local`);
  console.log(`  2. npx hardhat verify --network celo ${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
