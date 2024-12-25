// Check balances for tokens in the pool requires the controller contract address

import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import contractABI from "../abi/Controller.json";
import tokenAABI from "../abi/PlayerAToken.json";
const argv = yargs(hideBin(process.argv))
  .option("network", {
    type: "string",
    description: "The network to connect to",
    default: "localhost",
    demandOption: true,
  })
  .option("fromWallet", {
    type: "number",
    description: "Wallet number (1, 2, 3, or 4) to transfer from ",
    choices: [1, 2, 3, 4],
    demandOption: true,
  })

  .option("tokenIndex", {
    type: "number",
    description: "Token number (1, 2, 3, or 4) from the pool to transfer",
    choices: [1, 2, 3, 4],
    demandOption: true,
  })
  .option("toWallet", {
    type: "number",
    description: "Wallet number (1, 2, 3, or 4) to transfer to ",
    choices: [1, 2, 3, 4],
    demandOption: true,
  })
  .option("amount", {
    type: "string",
    description: "Amount to transfer",
    demandOption: true,
  })
  .parseSync();

async function checkTransfer() {

    console.log(`Network: ${argv.network}`);
    const network = argv.network;

    const providerApiKey = process.env.ALCHEMY_API_KEY;
    const providerBaseKey = process.env.BASE_PROVIDER_API_KEY;

   // create a new provider
  const provider = new ethers.providers.JsonRpcProvider(
    network === "sepolia"
      ? `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`
      : network === "base"
      ? `https://base-mainnet.g.alchemy.com/v2/${providerBaseKey}`
      : "http://127.0.0.1:8545/"
  );

    // Get wallet
  const pvtKey = process.env.ACCOUNT1_KEY;
  const pvtKey2 = process.env.ACCOUNT2_KEY;
  const pvtKey3 = process.env.ACCOUNT3_KEY;
  const pvtKey4 = process.env.ACCOUNT4_KEY;
  if (!pvtKey || !pvtKey2 || !pvtKey3 || !pvtKey4) {
    throw new Error("ACCOUNT_KEY(s) not set");
  }

  // Select wallet based on CLI argument
  let fromWallet: ethers.Wallet;
  switch (argv.fromWallet) {
    case 1:
      fromWallet = new ethers.Wallet(pvtKey, provider);
      break;
    case 2:
      fromWallet = new ethers.Wallet(pvtKey2, provider);
      break;
    case 3:
      fromWallet = new ethers.Wallet(pvtKey3, provider);
      break;
    case 4:
      fromWallet = new ethers.Wallet(pvtKey4, provider);
      break;
    default:
      throw new Error("Invalid wallet number");
  }

  let toWallet: ethers.Wallet;
  switch (argv.toWallet) {
    case 1:
      toWallet = new ethers.Wallet(pvtKey, provider);
      break;
    case 2:
      toWallet = new ethers.Wallet(pvtKey2, provider);
      break;
    case 3:
      toWallet = new ethers.Wallet(pvtKey3, provider);
      break;
    case 4:
      toWallet = new ethers.Wallet(pvtKey4, provider);
      break;
    default:
      throw new Error("Invalid wallet number");
  }

  // First verify we're connected to the right network
  console.log(`Transferring from wallet: ${fromWallet.address}`);

  //Controller Contract Address
  const controllerAddress = "0xe8a1616ADbE364DCd41866228AE193C65eC2F6cA";
  const controllerContract = new ethers.Contract(
    controllerAddress,
    contractABI.abi,
    fromWallet
  );

  const [addresses] =
    await controllerContract.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);
 

  // Check balances for tokens at indices 1 to 4
  for (let i = 1; i <= 4; i++) {
    const tokenAddress = addresses[i];
    const tokenContract = new ethers.Contract(tokenAddress, tokenAABI.abi, provider);

    const [symbol, balance] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.balanceOf(fromWallet.address)
    ]);
    

    const balanceInEth = ethers.utils.formatUnits(balance, 18);
    console.log(`Token ${symbol} (${tokenAddress})`);
    console.log(`Balance: ${balanceInEth} ${symbol}`);
    console.log('------------------------');
  }

  //from the selected from wallet and token index, transfer the amount to the to wallet
  const tokenAddress = addresses[argv.tokenIndex];
  const tokenContract = new ethers.Contract(tokenAddress, tokenAABI.abi, fromWallet);
  const amountInWei = ethers.utils.parseUnits(argv.amount, 18);
  const tx = await tokenContract.transfer(toWallet.address, amountInWei);
  console.log('Transaction hash:', tx.hash);
  await tx.wait(); // Wait for transaction to be mined
  console.log('Transfer completed!'); 


}

// Run with error handling
checkTransfer().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});