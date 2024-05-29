import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import contractABI from "../abi/Controller.json";
import tokenAABI from "../abi/PlayerAToken.json";
import tokenBABI from "../abi/PlayerBToken.json";

async function checkController() {
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

  const amountIn = ["100000000000000000", "100000000000000000"];
  const smallAmount = "10000000000000000";

  //Controller Contract Address
  const controllerAddress = "0x36dbec34256a0fc0ad12c4aab49648667f0f9342";
  const controllerContract = new ethers.Contract(
    controllerAddress,
    contractABI.abi,
    wallet
  );
  const [addresses, balance, totalBalance] =
    await controllerContract.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);
  console.log("Pool Tokens Amounts: ", balance);
  console.log("Total Pool Tokens Amount: ", totalBalance);

  const tokenA = addresses[1];
  console.log("Token A: ", tokenA);

  const tokenB = addresses[2];
  console.log("Token B: ", tokenB);
  //init pool function call on controller contract

  //token A contract address

  const tokenAContract = new ethers.Contract(tokenA, tokenAABI.abi, wallet);

  const approveATx = await tokenAContract.approve(
    controllerAddress,
    amountIn[0]
  );
  console.log("Approve transaction sent:", approveATx.hash);

  const approveReceipt = await approveATx.wait();
  console.log("Approve transaction mined:", approveReceipt.transactionHash);

  const transferATx = await tokenAContract.transferFrom(
    wallet.address,
    controllerAddress,
    smallAmount,
    {
      gasLimit: 500000,
    }
  );
  console.log("Transfer transaction sent:", transferATx.hash);

  const transferReceiptA = await transferATx.wait();
  console.log("Transfer transaction mined:", transferReceiptA.transactionHash);

  //token B contract address
  const tokenBContract = new ethers.Contract(tokenB, tokenBABI.abi, wallet);

  const approveBTx = await tokenBContract.approve(
    controllerAddress,
    amountIn[1],
    {
      gasLimit: 500000,
    }
  );
  console.log("Approve transaction sent:", approveBTx.hash);

  const approveBReceipt = await approveBTx.wait();
  console.log("Approve transaction mined:", approveBReceipt.transactionHash);

  const transferBTx = await tokenBContract.transferFrom(
    wallet.address,
    controllerAddress,
    smallAmount
  );
  console.log("Transfer transaction sent:", transferBTx.hash);

  const transferReceiptB = await transferBTx.wait();
  console.log("Transfer transaction mined:", transferReceiptB.transactionHash);

  //Sending the function call to the contract
  let txResponse = await controllerContract.getPoolId();
  //   await txResponse.wait();
  console.log("Transaction response 1 ", txResponse);

  txResponse = await controllerContract.getVault();
  //   await txResponse.wait();
  console.log("Transaction response 2 ", txResponse);

  const poolSpecialization = await controllerContract.getPoolSpecialization();
  console.log("Pool Specialization: ", poolSpecialization);

  const joinExitEnabled = await controllerContract.getJoinExitEnabled();
  console.log("Join Exit Enabled: ", joinExitEnabled);

  const swapEnabled = await controllerContract.getSwapEnabled();
  console.log("Swap Enabled: ", swapEnabled);

  const setJoinExitEnabled = await controllerContract.setJoinExitEnabled(
    false,
    {
      gasLimit: 500000,
    }
  );
  await setJoinExitEnabled.wait();
  console.log(
    "Set Join Exit Enabled: ",
    await controllerContract.getJoinExitEnabled()
  );
  //   const approveA = await controllerContract.approveToken(
  //     tokenA,
  //     "1000000000000000000"
  //   );
  //   await approveA.wait();
  //   console.log("Token A Approved: ", approveA.hash);

  //   const approveB = await controllerContract.approveToken(
  //     tokenB,
  //     "1000000000000000000"
  //   );
  //   await approveB.wait();
  //   console.log("Token B Approved: ", approveB.hash);

  //   const tokenATransfer = await controllerContract.transferToken(
  //     tokenA,
  //     amountIn[0],
  //     { gasLimit: 500000 }
  //   );
  //   await tokenATransfer.wait();
  //   console.log("Token A transfer to controller");

  //   const tokenBtransfer = await controllerContract.transferToken(
  //     tokenB,
  //     amountIn[1],
  //     { gasLimit: 500000 }
  //   );
  //   await tokenBtransfer.wait();
  //   console.log("Token B transfer to controller");

  const initPool = await controllerContract.initPool(
    [tokenA, tokenB],
    amountIn,
    { gasLimit: 500000 } // Set the gas limit for the transaction
  );
  await initPool.wait();
  console.log("Init Pool: ", initPool.hash);
}

try {
  checkController();
} catch (err) {
  console.log(err);
}
// Path: examples/controller/01_checkController.ts
