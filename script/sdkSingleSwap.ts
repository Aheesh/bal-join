import { BalancerSDK, Network, SwapTypes } from "@balancer-labs/sdk";
import { BigNumber } from "@ethersproject/bignumber";
import { JsonRpcProvider } from "@ethersproject/providers";

// Set up the provider
const provider = new JsonRpcProvider("http://127.0.0.1:8545");

async function sdkSingleSwap() {
  const balancer = new BalancerSDK({
    network: Network.MAINNET,
    rpcUrl: "http://127.0.0.1:8545",
  });

  const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"; // Balancer Vault address
  const poolId =
    "0x30347b6dedbec9df3d364926b2b37de4b8ba4ecb000100000000000000000693"; // Pool ID you want to swap on
  const tokenInAddress = "0xeA8AE08513f8230cAA8d031D28cB4Ac8CE720c68"; // Address of token you want to swap from
  const tokenOutAddress = "0x6431AF84d34F0522cAA58b221d94A150B5AdAC69"; // Address of token you want to swap to
  const amountIn = BigNumber.from("1000000000000000"); // Amount of tokenIn to swap 1e15

  const swapInfo = await balancer.swaps.queryBatchSwap();
}
try {
  sdkSingleSwap();
} catch (err) {
  console.log(err);
}
