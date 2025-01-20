// Check balances for tokens in the pool requires the controller contract address
//TODO fetch the controller address.

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
  .option("wallet", {
    type: "number",
    description: "Wallet number (1, 2, 3, or 4) to check balances",
    choices: [1, 2, 3, 4],
    demandOption: true,
  })
  .parseSync();

async function checkBalances() {

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
  let selectedWallet: ethers.Wallet;
  switch (argv.wallet) {
    case 1:
      selectedWallet = new ethers.Wallet(pvtKey, provider);
      break;
    case 2:
      selectedWallet = new ethers.Wallet(pvtKey2, provider);
      break;
    case 3:
      selectedWallet = new ethers.Wallet(pvtKey3, provider);
      break;
    case 4:
      selectedWallet = new ethers.Wallet(pvtKey4, provider);
      break;
    default:
      throw new Error("Invalid wallet number");
  }

  // First verify we're connected to the right network
  console.log(`Checking balances for wallet: ${selectedWallet.address}`);

  //Controller Contract Address
  const controllerAddress = "0xaE0b23C9a28Ab1959D2a7cc5117bB5c65246ff06";
  const controllerContract = new ethers.Contract(
    controllerAddress,
    contractABI.abi,
    selectedWallet
  );

  const [addresses] = await controllerContract.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);
 
  // Check balances for tokens at indices 1 to 4
  for (let i = 1; i <= 4; i++) {
    const tokenAddress = addresses[i];
    const tokenContract = new ethers.Contract(tokenAddress, tokenAABI.abi, provider);

    const [symbol, walletBalance, controllerBalance] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.balanceOf(selectedWallet.address),
      tokenContract.balanceOf(controllerAddress)
    ]);

    console.log(`\nToken ${symbol} (${tokenAddress})`);
    console.log(`Wallet Balance: ${ethers.utils.formatUnits(walletBalance, 18)} ${symbol}`);
    console.log(`Controller Balance: ${ethers.utils.formatUnits(controllerBalance, 18)} ${symbol}`);
    console.log('------------------------');
  }


}

// Run with error handling
checkBalances().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});