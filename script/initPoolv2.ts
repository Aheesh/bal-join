import * as dotenv from "dotenv";
dotenv.config();
import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  PoolType,
} from "@balancer-labs/sdk";
import { ContractFactory, ethers } from "ethers";
import contractABI from "../abi/Controller.json";

async function poolInit() {
  //   // establish link to the BalancerSDK
  //   const config: BalancerSdkConfig = {
  //     network: Network.MAINNET,
  //     rpcUrl: "http://127.0.0.1:8545",
  //   }; // Using local fork for simulation
  //   const balancerSDK = new BalancerSDK(config);

  // create a new provider
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545/"
  );

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

  //Controller Contract Address
  const controllerAddress = "0xad5500eae262d5835890571be0cc2e527bebd18e";
  const controllerContract = new ethers.Contract(
    controllerAddress,
    contractABI.abi,
    wallet
  );

  console.log("Controller Contract:", controllerContract);
  //init pool function call on controller contract
  const functionName = "initPool";

  // Managed pool tokens and amount for the pool
  const tokensIn = [
    "0xf42Ec71A4440F5e9871C643696DD6Dc9a38911F8",
    "0xbc71F5687CFD36f64Ae6B4549186EE3A6eE259a4",
  ];
  const amountIn = ["1000000000000000000", "1000000000000000000"];

  //Sending the initial join transaction
  const txResponse = await controllerContract[functionName](
    tokensIn,
    amountIn,
    { gasLimit: 30000000 }
  );
  await txResponse.wait();
  console.log("Transaction hash:", txResponse.hash);

  // Check the pool balances.
  //  const poolId =
  //  "0x45d7e1cf2b2efd9bb8030aae2f7978a20e94647900010000000000000000068a";
  //   const functionGetPool = "getPoolId";
  //   //const [tokens, balance, totalbalance]
  //   const poolId = await controllerContract[functionGetPool]();
  //   //await tokens.wait();
  //   await poolId.wait();
  //   console.log("Pool Id:", poolId);

  //   console.log("token txn:", tokens.hash);
  //   console.log("Pool tokens:", tokens);
  //   console.log("Pool balances:", balance);
  //   console.log("Pool balances:", totalbalance);

  // Call the functions
}

try {
  poolInit();
} catch (err) {
  console.log(err);
}
// Path: examples/pools/create/05_poolInit.ts
