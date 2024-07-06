// Query token Out amount using queryBatchSwap

import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { BalancerSDK, Network, SwapType } from "@balancer-labs/sdk";
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
    network: argv.network === "base" ? Network.BASE : Network.MAINNET,
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

  const tokenIn = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
  const tokenOut = "0xaA4eC2d86E61632E88Db93cf6D2a42E5f458DC99";
  const amount = parseFixed("100", 18);
  const gasPrice = parseFixed("0", 18);

  const swaps = [
    {
      poolId:
        "0xc8503e1a4e439800dea3424cbfc085cbeb6c3bfe000100000000000000000172",
      assetInIndex: 0,
      assetOutIndex: 1,
      amount: String(100e18),
      userData: "0x",
    },
  ];

  const assets = [tokenIn, tokenOut];
  const funds = {
    fromInternalBalance: false,
    recipient: address,
    sender: address,
    toInternalBalance: false,
  };

  const queryInfo = await sdk.swaps.queryBatchSwap({
    kind: SwapType.SwapExactIn,
    swaps,
    assets,
  });
  console.log(queryInfo);
}

try {
  querySwap();
} catch (e) {
  console.error(e);
}
