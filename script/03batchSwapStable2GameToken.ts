/**
 * Encode and send a batch swap transaction.
 * Uses local fork of mainnet: $ yarn run node
 *
 * Run with:
 * npx ts-node ./script/batchSwap.ts
 */
import * as dotenv from "dotenv";
dotenv.config();
import { JsonRpcProvider } from "@ethersproject/providers";
import { BalancerSDK, Network, SwapType, Swaps } from "@balancer-labs/sdk";
import { formatUnits, parseEther } from "@ethersproject/units";
import { ethers } from "ethers";
import tokenStableABI from "../abi/tokenStable.json";
import tokenBABI from "../abi/PlayerBToken.json";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

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

const providerApiKey = process.env.INFURA_API_KEY;

// create a new provider
const provider = new ethers.providers.JsonRpcProvider(
  network === "sepolia"
    ? `https://sepolia.infura.io/v3/${providerApiKey}`
    : "http://127.0.0.1:8545/"
);

// get the signer account
const pvtKey = process.env.ACCOUNT1_KEY;
const pvtKey2 = process.env.ACCOUNT2_KEY;
if (!pvtKey || !pvtKey2) {
  throw new Error("ACCOUNT_KEY is not set");
}
//Get the EOA wallets
const wallet = new ethers.Wallet(pvtKey, provider);
const wallet2 = new ethers.Wallet(pvtKey2, provider);

async function runBatchSwap() {
  const sdk = new BalancerSDK({
    network: argv.network === "sepolia" ? Network.SEPOLIA : Network.MAINNET,
    rpcUrl:
      argv.network === "sepolia"
        ? `https://sepolia.infura.io/v3/${providerApiKey}`
        : "http://127.0.0.1:8545",
  });

  const { contracts } = sdk;

  const signer = provider.getSigner(wallet2.address);
  const address = await signer.getAddress();
  console.log("Account address:", address);

  const value = String(1e18); // 1 Stable Token

  const encodeBatchSwapData = Swaps.encodeBatchSwap({
    kind: SwapType.SwapExactIn,
    swaps: [
      {
        poolId:
          "0xa04263c06c9a4bc4655a2caf251ee5b424c868b60001000000000000000001af",
        assetInIndex: 0,
        assetOutIndex: 1,
        amount: String(1e18),
        userData: "0x",
      },
    ],
    assets: [
      "0x2498e8059929e18e2a2cED4e32ef145fa2F4a744",
      //token Stable
      "0x3abBB0D6ad848d64c8956edC9Bf6f18aC22E1485",
      //token A
    ],
    funds: {
      fromInternalBalance: false,
      recipient: address,
      sender: address,
      toInternalBalance: false,
    },
    limits: [value, "0"],
    deadline: Math.ceil(Date.now() / 1000) + 60,
  });

  const tokenStable = "0x2498e8059929e18e2a2cED4e32ef145fa2F4a744";

  //load token contract token Stable

  const tokenStableContract = new ethers.Contract(
    tokenStable,
    tokenStableABI.abi,
    wallet2
  );

  const tokenB = "0x3abBB0D6ad848d64c8956edC9Bf6f18aC22E1485";

  //load token contract token B
  const tokenBContract = new ethers.Contract(tokenB, tokenBABI.abi, wallet2);

  let tokenStableBalance = await tokenStableContract.balanceOf(address);
  let tokenBBalance = await tokenBContract.balanceOf(address);

  console.log(
    "🐎 🐎 🐎 Stable Token 🐎 🐎 🐎  balance before swap:",
    formatUnits(tokenStableBalance, 18)
  );
  console.log("Token A balance before swap:", formatUnits(tokenBBalance, 18));

  //Check the Vault allowance for Token Stable from EOA
  let vaultAllowanceTokenStable = await tokenStableContract.allowance(
    address,
    contracts.vault.address
  );
  console.log(
    "Vault allowance for 🐎 🐎 🐎 Stable Token 🐎 🐎 🐎  from EOA",
    vaultAllowanceTokenStable
  );

  if (vaultAllowanceTokenStable.lt(parseEther(value))) {
    console.log(
      "Vault allowance for stable token is less than value for swap, approving...💸 💸 💸"
    );
    const approveTx = await tokenStableContract.approve(
      contracts.vault.address,
      value
    );
    await approveTx.wait();

    vaultAllowanceTokenStable = await tokenStableContract.allowance(
      address,
      contracts.vault.address
    );
    console.log(
      "Vault allowance for Token Stable from EOA ",
      vaultAllowanceTokenStable
    );
  }

  //Check the Vault allowance for Token B from EOA
  let vaultAllowanceTokenB = await tokenBContract.allowance(
    address,
    contracts.vault.address
  );
  console.log("Vault allowance for TokenB from EOA", vaultAllowanceTokenB);

  if (vaultAllowanceTokenB.lt(parseEther(value))) {
    console.log(
      "Vault Token A allowance is less than value, approving...💸 💸 💸"
    );
    const approveTx = await tokenBContract.approve(
      contracts.vault.address,
      value
    );
    await approveTx.wait();

    vaultAllowanceTokenB = await tokenBContract.allowance(
      address,
      contracts.vault.address
    );
    console.log("Vault allowance for TokenB from EOA ", vaultAllowanceTokenB);
  }

  await wallet2.sendTransaction({
    data: encodeBatchSwapData,
    to: contracts.vault.address,
    value,
  });

  tokenStableBalance = await tokenStableContract.balanceOf(address);
  tokenBBalance = await tokenBContract.balanceOf(address);

  console.log(
    "Token Stable balance after swap:",
    formatUnits(tokenStableBalance, 18)
  );
  console.log("Token A balance after swap:", formatUnits(tokenBBalance, 18));
}

try {
  runBatchSwap();
} catch (err) {
  console.log(err);
}
