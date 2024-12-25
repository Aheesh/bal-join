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

  const tokenIn = "0x2498e8059929e18e2a2cED4e32ef145fa2F4a744";
  const tokenOut = "0x021DBfF4A864Aa25c51F0ad2Cd73266Fde66199d";
  const amount = parseFixed("100", 18);
  const gasPrice = parseFixed("0", 18);

  const swaps = [
    {
      poolId:
        "0xa04263c06c9a4bc4655a2caf251ee5b424c868b60001000000000000000001af",
      assetInIndex: 0,
      assetOutIndex: 1,
      amount: String(1e18),
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
