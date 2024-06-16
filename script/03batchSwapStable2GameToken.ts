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
          "0xa6a879f60710cbb415bba5bbc18805b013c26e0d00010000000000000000069b",
        assetInIndex: 0,
        assetOutIndex: 1,
        amount: String(1e15),
        userData: "0x",
      },
    ],
    assets: [
      "0xA8d14b3d9e2589CEA8644BB0f67EB90d21079f8B",
      //token Stable
      "0x6B9C4119796C80Ced5a3884027985Fd31830555b",
      //token Draw
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

  const tokenStable = contracts.ERC20(
    "0xA8d14b3d9e2589CEA8644BB0f67EB90d21079f8B",
    signer
  );

  const tokenB = contracts.ERC20(
    "0x6B9C4119796C80Ced5a3884027985Fd31830555b",
    signer
  );

  let tokenStableBalance = await tokenStable.balanceOf(address);
  let tokenBBalance = await tokenB.balanceOf(address);

  console.log(
    "Token A balance before swap:",
    formatUnits(tokenStableBalance, 18)
  );
  console.log("Token B balance before swap:", formatUnits(tokenBBalance, 18));

  //Check the Vault allowance for Token Stable from EOA
  let vaultAllowanceTokenStable = await tokenStable.allowance(
    address,
    contracts.vault.address
  );
  console.log("Vault allowance for TokenA from EOA", vaultAllowanceTokenStable);

  if (vaultAllowanceTokenStable.lt(parseEther(value))) {
    console.log("Vault A allowance is less than value, approving...💸 💸 💸");
    const approveTx = await tokenStable.approve(contracts.vault.address, value);
    await approveTx.wait();

    vaultAllowanceTokenStable = await tokenStable.allowance(
      address,
      contracts.vault.address
    );
    console.log(
      "Vault allowance for Token Stable from EOA ",
      vaultAllowanceTokenStable
    );
  }

  //Check the Vault allowance for Token B from EOA
  let vaultAllowanceTokenB = await tokenB.allowance(
    address,
    contracts.vault.address
  );
  console.log("Vault allowance for TokenB from EOA", vaultAllowanceTokenB);

  if (vaultAllowanceTokenB.lt(parseEther(value))) {
    console.log("Vault A allowance is less than value, approving...💸 💸 💸");
    const approveTx = await tokenB.approve(contracts.vault.address, value);
    await approveTx.wait();

    vaultAllowanceTokenB = await tokenB.allowance(
      address,
      contracts.vault.address
    );
    console.log("Vault allowance for TokenB from EOA ", vaultAllowanceTokenB);
  }

  await signer.sendTransaction({
    data: encodeBatchSwapData,
    to: contracts.vault.address,
    value,
  });

  tokenStableBalance = await tokenStable.balanceOf(address);
  tokenBBalance = await tokenB.balanceOf(address);

  console.log(
    "Token Stable balance after swap:",
    formatUnits(tokenStableBalance, 18)
  );
  console.log("Token Draw balance after swap:", formatUnits(tokenBBalance, 18));
}

try {
  runBatchSwap();
} catch (err) {
  console.log(err);
}
