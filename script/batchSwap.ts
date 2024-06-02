/**
 * Encode and send a batch swap transaction.
 * Uses local fork of mainnet: $ yarn run node
 *
 * Run with:
 * npx ts-node ./script/batchSwap.ts
 */

import { JsonRpcProvider } from "@ethersproject/providers";
import { BalancerSDK, Network, SwapType, Swaps } from "@balancer-labs/sdk";
import { formatUnits, parseEther } from "@ethersproject/units";

// Set up the provider
const provider = new JsonRpcProvider("http://127.0.0.1:8545");

async function runBatchSwap() {
  const sdk = new BalancerSDK({
    network: Network.MAINNET,
    rpcUrl: "http://127.0.0.1:8545",
  });

  const { contracts } = sdk;

  const signer = provider.getSigner(1);
  const address = await signer.getAddress();
  console.log("Account address:", address);

  const value = String(1e15); // Token A

  const encodeBatchSwapData = Swaps.encodeBatchSwap({
    kind: SwapType.SwapExactIn,
    swaps: [
      {
        poolId:
          "0x30347b6dedbec9df3d364926b2b37de4b8ba4ecb000100000000000000000693",
        assetInIndex: 1,
        assetOutIndex: 2,
        amount: String(1e15),
        userData: "0x",
      },
    ],
    assets: [
      "0xeA8AE08513f8230cAA8d031D28cB4Ac8CE720c68",
      //token A
      "0x6431AF84d34F0522cAA58b221d94A150B5AdAC69",
      //token B
    ],
    funds: {
      fromInternalBalance: false,
      recipient: address,
      sender: address,
      toInternalBalance: false,
    },
    limits: [value, "0", "0"],
    deadline: Math.ceil(Date.now() / 1000) + 60,
  });

  const tokenA = contracts.ERC20(
    "0x6431AF84d34F0522cAA58b221d94A150B5AdAC69",
    provider
  );

  const tokenB = contracts.ERC20(
    "0xeA8AE08513f8230cAA8d031D28cB4Ac8CE720c68",
    provider
  );

  let tokenABalance = await tokenA.balanceOf(address);
  let tokenBBalance = await tokenB.balanceOf(address);

  console.log("Token A balance before swap:", formatUnits(tokenABalance, 18));
  console.log("Token B balance before swap:", formatUnits(tokenBBalance, 18));

  await signer.sendTransaction({
    data: encodeBatchSwapData,
    to: contracts.vault.address,
    value,
  });

  tokenABalance = await tokenA.balanceOf(address);
  tokenBBalance = await tokenB.balanceOf(address);

  console.log("Token A balance after swap:", formatUnits(tokenABalance, 18));
  console.log("Token B balance after swap:", formatUnits(tokenBBalance, 18));
}

try {
  runBatchSwap();
} catch (err) {
  console.log(err);
}
