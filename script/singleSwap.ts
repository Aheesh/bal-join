import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import vaultABI from "../abi/vault.json";

async function singleSwap() {
  // create a new provider
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545/"
  );
  // get the signer account
  const pvtKey = process.env.ACCOUNT2_KEY;
  if (!pvtKey) {
    throw new Error("ACCOUNT2_KEY is not set");
  }
  const wallet = new ethers.Wallet(pvtKey, provider);

  // get the address of the signer
  const signerAddress = await wallet.getAddress();
  console.log("Signer address:", signerAddress);

  // Load contract for Balancer Vault
  const address_vault = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  const contract_vault = new ethers.Contract(
    address_vault,
    vaultABI.abi,
    wallet
  );

  //Where are the tokens coming from / going to?
  const fund_settings = {
    sender: signerAddress,
    recipient: signerAddress,
    fromInternalBalance: false,
    toInternalBalance: false,
  };

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time

  //Pool details
  const poolId =
    "0x30347b6dedbec9df3d364926b2b37de4b8ba4ecb000100000000000000000693";

  //Token addresses (checksum format)
  const tokenIn = "0xeA8AE08513f8230cAA8d031D28cB4Ac8CE720c68".toLowerCase(); //Token A
  const tokenOut = "0x6431AF84d34F0522cAA58b221d94A150B5AdAC69".toLowerCase(); //Token B

  // Token data
  const token_data: {
    [key: string]: { symbol: string; decimals: string; limit: string };
  } = {};
  token_data[tokenIn] = {
    symbol: "PlayerAToken",
    decimals: "18",
    limit: "0",
  };
  token_data[tokenOut] = {
    symbol: "PlayerBToken",
    decimals: "18",
    limit: "1",
  };

  const swap = {
    poolId: poolId,
    assetIn: tokenIn,
    assetOut: tokenOut,
    amount: String(1e15),
  };

  // 0 = GIVEN_IN, 1 = GIVEN_OUT
  const swap_kind = 0;

  const swap_struct = {
    poolId: swap["poolId"],
    kind: swap_kind,
    assetIn: swap["assetIn"],
    assetOut: swap["assetOut"],
    amount: swap["amount"],
    userData: "0x",
  };

  const fund_struct = {
    sender: fund_settings["sender"],
    recipient: fund_settings["recipient"],
    fromInternalBalance: fund_settings["fromInternalBalance"],
    toInternalBalance: fund_settings["toInternalBalance"],
  };
  const token_limit = String(1e12);

  const single_swap_function = contract_vault.swap(
    swap_struct,
    fund_struct,
    token_limit,
    deadline.toString()
  );

  //Gas estimation
  var gas_estimate;
  try {
    gas_estimate = await single_swap_function.estimateGas();
  } catch (err) {
    gas_estimate = 50000;
    console.log(
      "Failed to estimate gas, attempting to send with",
      gas_estimate,
      "gas limit..."
    );
  }

  console.log("Gas estimate:", gas_estimate);

  const tx = await wallet.sendTransaction({
    data: single_swap_function.data,
    to: address_vault,
    value: 0,
  });
  console.log("Transaction hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction was mined in block:", receipt.blockNumber);
}

try {
  singleSwap();
} catch (err) {
  console.log(err);
}
