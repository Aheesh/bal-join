import * as dotenv from "dotenv";
dotenv.config();
import { BalancerSDK, BalancerSdkConfig, Network } from "@balancer-labs/sdk";
import { ethers } from "ethers";

async function poolInit() {
  // establish link to the BalancerSDK
  const config: BalancerSdkConfig = {
    network: Network.MAINNET,
    rpcUrl: "http://127.0.0.1:8545",
  }; // Using local fork for simulation
  const balancerSDK = new BalancerSDK(config);

  // create a new provider
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

  // get the signer account
  const pvtKey = process.env.ACCOUNT1_KEY;
  if (!pvtKey) {
    throw new Error("ACCOUNT1_KEY is not set");
  }
  let wallet = new ethers.Wallet(pvtKey);

  // connect the wallet to the provider
  wallet = wallet.connect(provider);

  // get the address of the signer
  const signerAddress = await wallet.getAddress();
  console.log("Signer address:", signerAddress);

  // INIT weighted pool

  const poolId =
    "0x45d7e1cf2b2efd9bb8030aae2f7978a20e94647900010000000000000000068a";

  // Check the pool balances.
  const tokens = await balancerSDK.contracts.vault.getPoolTokens(poolId);
  console.log("Pool Id:", poolId);
  console.log("Pool tokens:", tokens.tokens);
  console.log("Pool balances:", tokens.balances);

  // Call the functions
}

try {
  poolInit();
} catch (err) {
  console.log(err);
}
// Path: examples/pools/create/05_poolInit.ts
