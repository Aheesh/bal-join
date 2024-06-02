/**
 * How to build a swap and send it using ethers.js
 *
 * How to run:
 * npx ts-node ./script/swapSDK.ts
 */

import { BalancerSDK, Network } from "@balancer-labs/sdk";
import { formatFixed } from "@ethersproject/bignumber";
import { ethers } from "ethers";

const tokenIn = "0x6431AF84d34F0522cAA58b221d94A150B5AdAC69"; //Token B
const tokenOut = "0xeA8AE08513f8230cAA8d031D28cB4Ac8CE720c68"; //Token A

const amount = String(1e15); // Token A

const sdk = new BalancerSDK({
  network: Network.MAINNET,
  rpcUrl: "http://127.0.0.1:8545",
});

const { swaps } = sdk;

const erc20out = sdk.contracts.ERC20(tokenOut, sdk.provider);

async function swap() {
  const signer = sdk.provider.getSigner(1);
  const account = await signer.getAddress();
  console.log("Account:", account);

  //Set execution deadline to 60 seconds from now
  const deadline = String(Math.ceil(Date.now() / 1000) + 60);

  //Set slippage
  const maxSlippage = 10; //10 bsp

  //Building the route payload
  const payload = await swaps.buildRouteExactIn(
    account,
    account,
    tokenIn,
    tokenOut,
    amount,
    { maxSlippage, deadline }
  );

  //Extract the parameters required for sendTransaction
  const { to, data, value } = payload;

  //Execution with ethers.js

  try {
    const balanceBefore = await erc20out.balanceOf(account);
    console.log("Balance before swap:", formatFixed(balanceBefore, 18));

    await (await signer.sendTransaction({ to, data, value })).wait();

    //check delta
    const balanceAfter = await erc20out.balanceOf(account);
    console.log("Balance after swap:", formatFixed(balanceAfter, 18));
  } catch (err) {
    console.log(err);
  }
}

try {
  swap();
} catch (err) {
  console.log(err);
}
