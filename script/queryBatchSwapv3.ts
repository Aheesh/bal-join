// Query token Out amount using queryBatchSwap

import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { BalancerSDK, Network } from "@balancer-labs/sdk";
import { parseFixed } from "@ethersproject/bignumber";

const argv = yargs(hideBin(process.argv))
  .option("network", {
    type: "string",
    description: "The network to connect to",
    default: "localhost",
    demandOption: true,
  })
  .parseSync();

console.log(`Network:${argv.network}`);
const network = argv.network;

const providerApiKey = process.env.BASE_PROVIDER_API_KEY;

// create a new provider
const provider = new ethers.providers.JsonRpcProvider(
  network === "base"
    ? `https://base-mainnet.g.alchemy.com/v2/${providerApiKey}`
    : "http://127.0.0.1:8545/"
);

// get the signer account
const pvtKey2 = process.env.ACCOUNT2_KEY;
if (!pvtKey2) {
  throw new Error("ACCOUNT_KEY is not set");
}
//Get the EOA wallets
const wallet2 = new ethers.Wallet(pvtKey2, provider);

async function querySwap() {
  const sdk = new BalancerSDK({
    network: argv.network === "sepolia" ? Network.SEPOLIA : Network.MAINNET,
    rpcUrl:
      argv.network === "base"
        ? `https://base-mainnet.g.alchemy.com/v2/${providerApiKey}`
        : "http://127.0.0.1:8545/",
  });

  // get the signer account
  const pvtKey2 = process.env.ACCOUNT2_KEY;
  if (!pvtKey2) {
    throw new Error("ACCOUNT_KEY is not set");
  }
  //Get the EOA wallets
  const wallet2 = new ethers.Wallet(pvtKey2, provider);

  const signer = provider.getSigner(wallet2.address);
  const address = await signer.getAddress();
  console.log("EOA Account address:", address);

  const { swaps } = sdk;

  const tokenIn = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
  const tokenOut = "0xe96891F2d3838Bfbbce1285e0913b195acc935c5";
  const amount = parseFixed("100", 18);
  const gasPrice = parseFixed("0", 18);

  await swaps.fetchPools();

  const swapInfo = await swaps.findRouteGivenIn({
    tokenIn,
    tokenOut,
    amount,
    gasPrice,
    maxPools: 1,
  });
  console.log("Swap Info:", swapInfo);

  const query = await swaps.queryExactIn(swapInfo);

  if (swapInfo.returnAmount.isZero()) {
    console.log("No Swap");
    return;
  }
  // Simulates a call to `batchSwap`, returning an array of Vault asset deltas.
  const deltas = await swaps.queryExactIn(swapInfo);

  // Prints the asset deltas for the swap.
  // Positive values mean the user sending the asset to the vault, and negative is the amount received from the vault.
  // The asset deltas should be the same as the ones returned by `batchSwap`.
  console.log(deltas);
}

try {
  querySwap();
} catch (e) {
  console.error(e);
}
