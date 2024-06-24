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
          "0x63437a18a0670f91c9dea518809b3aa5a59e77a00001000000000000000006a3",
        assetInIndex: 0,
        assetOutIndex: 1,
        amount: String(1e7),
        userData: "0x",
      },
    ],
    assets: [
      "0x2e13f7644014F6E934E314F0371585845de7B986",
      //token Stable
      "0xFE92134da38df8c399A90a540f20187D19216E05",
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

  const tokenStable = contracts.ERC20(
    "0x2e13f7644014F6E934E314F0371585845de7B986",
    signer
  );

  const tokenB = contracts.ERC20(
    "0xFE92134da38df8c399A90a540f20187D19216E05",
    signer
  );

  let tokenStableBalance = await tokenStable.balanceOf(address);
  let tokenBBalance = await tokenB.balanceOf(address);

  console.log(
    "🐎 🐎 🐎 Stable Token 🐎 🐎 🐎  balance before swap:",
    formatUnits(tokenStableBalance, 18)
  );
  console.log("Token A balance before swap:", formatUnits(tokenBBalance, 18));

  //Check the Vault allowance for Token Stable from EOA
  let vaultAllowanceTokenStable = await tokenStable.allowance(
    address,
    contracts.vault.address
  );
  console.log(
    "Vault allowance for 🐎 🐎 🐎 Stable Token 🐎 🐎 🐎  from EOA",
    vaultAllowanceTokenStable
  );

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
    formatUnits(tokenStableBalance, 6)
  );
  console.log("Token Draw balance after swap:", formatUnits(tokenBBalance, 18));
}

try {
  runBatchSwap();
} catch (err) {
  console.log(err);
}
