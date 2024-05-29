import * as dotenv from "dotenv";
dotenv.config();
import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  PoolType,
} from "@balancer-labs/sdk";
import { ethers } from "ethers";

async function poolInit() {
  // establish link to the BalancerSDK
  const config: BalancerSdkConfig = {
    network: Network.ARBITRUM,
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
  const tokenA = "0xf42Ec71A4440F5e9871C643696DD6Dc9a38911F8";
  const tokenB = "0xbc71F5687CFD36f64Ae6B4549186EE3A6eE259a4";

  const poolId =
    "0x517ba85812b324ae9712e40b3ac62ed1ffe86dc2000100000000000000000690";
  const poolAddress = "0x517ba85812b324ae9712e40b3ac62ed1ffe86dc2";
  const PToken = "0x517ba85812b324ae9712e40b3ac62ed1ffe86dc2";

  const weightedPoolFactory = balancerSDK.pools.poolFactory.of(
    PoolType.Weighted
  );

  //Approve BPT and pool tokens to be transferred by vault.
  const poolTokens = [PToken, tokenA, tokenB];
  const amountsIn = [
    "5192296858534827628530496329000000",
    "1000000000000000000",
    "1000000000000000000",
  ];
  for (let i = 0; i < poolTokens.length; i++) {
    const token = poolTokens[i];
    const amountIn = amountsIn[i];
    const tokenContract = new ethers.Contract(
      token,
      [
        "function approve(address spender, uint256 amount) public returns (bool)",
      ],
      wallet
    );
    await tokenContract.approve(
      "0xba12222222228d8ba445958a75a0704d566bf2c8",
      amountIn
    );
  }

  // Build Init and Join the pool.
  const initJoinParams = weightedPoolFactory.buildInitJoin({
    joiner: signerAddress,
    poolId,
    poolAddress,
    tokensIn: poolTokens,
    amountsIn: amountsIn,
  });

  console.log("poolTokens Length:", poolTokens.length);
  console.log("AmountsIn Length:", amountsIn.length);

  //Sending the initial join transaction
  await wallet.sendTransaction({
    to: initJoinParams.to,
    data: initJoinParams.data,
    gasLimit: 30000000,
  });

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
