import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import contractABI from "../abi/Controller.json";
import tokenAABI from "../abi/PlayerAToken.json";
import tokenBABI from "../abi/PlayerBToken.json";

async function contollerLP() {
  // create a new provider
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545/"
  );

  // get the signer account
  const pvtKey = process.env.ACCOUNT1_KEY;
  if (!pvtKey) {
    throw new Error("ACCOUNT1_KEY is not set");
  }
  const wallet = new ethers.Wallet(pvtKey, provider);

  // get the address of the signer
  const signerAddress = await wallet.getAddress();
  console.log("Signer address:", signerAddress);

  const amountIn = ["100000000000000000", "100000000000000000"];

  //Controller Contract Address
  const controllerAddress = "0x72457677ce1f3b374342c7d68ddc0655dee744a4";
  const controllerContract = new ethers.Contract(
    controllerAddress,
    contractABI.abi,
    wallet
  );

  //Get the tokens in the managed pool contract
  const [addresses, balance, totalBalance] =
    await controllerContract.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);
  console.log("Pool Tokens Amounts: ", balance);
  console.log("Total Pool Tokens Amount: ", totalBalance);

  const tokenA = addresses[1];
  console.log("Token A: ", tokenA);

  const tokenB = addresses[2];
  console.log("Token B: ", tokenB);

  //get the vaultID
  const vaultID = await controllerContract.getVault();
  console.log("VaultID check response ", vaultID);

  //EOA approve controller contract to spend tokenA

  const tokenAContract = new ethers.Contract(tokenA, tokenAABI.abi, wallet);

  //Check balance of tokenA with EOA
  // const EOATokenABalanceCheck = await tokenAContract.checkBalance(
  //   wallet.address
  // );

  // console.log("Token A - Balance of EOA", EOATokenABalanceCheck);

  // //Approve Controller to transfer TokenA
  // const approveATx = await tokenAContract.approve(
  //   controllerAddress,
  //   amountIn[0]
  // );
  // console.log("Approve Vault to transfer token A:", approveATx.hash);

  // const approveReceipt = await approveATx.wait();
  // console.log("Approve transaction mined:", approveReceipt.transactionHash);

  // //Check the Controller allowance for Token A
  // const controllerAllowanceTokenA = await tokenAContract.allowance(
  //   wallet.address,
  //   controllerAddress
  // );
  // console.log(
  //   "Controller allowance from EOA for Token A",
  //   controllerAllowanceTokenA
  // );

  //transfer tokenA to Controller
  const transferATx = await tokenAContract.transfer(
    controllerAddress,
    amountIn[0],
    {
      gasLimit: 500000,
    }
  );
  console.log(
    "Transfer of token A to Controller transaction sent:",
    transferATx.hash
  );

  const transferReceiptA = await transferATx.wait();
  console.log(
    "Transfer of Token A to Controller transaction mined:",
    transferReceiptA.transactionHash
  );

  const controllerTokenABalanceCheck = await tokenAContract.checkBalance(
    controllerAddress
  );
  console.log(
    "TokenA - Balance of TokenA with controller contract ",
    controllerTokenABalanceCheck
  );

  //Controller approve Vault to transfer TokenA
  const vaultTokenAFromContoller = await controllerContract.approveVault(
    tokenA,
    amountIn[0]
  );
  console.log(
    "Controller approved Vault to transfer Token A",
    vaultTokenAFromContoller
  );

  //Check the Vault allowance for Token A from Controller
  const vaultAllowanceTokenA = await tokenAContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    "Vault allowance for TokenA from Controller",
    vaultAllowanceTokenA
  );

  //EOA approve controller to spend token B
  const tokenBContract = new ethers.Contract(tokenB, tokenBABI.abi, wallet);

  //check balance of EOA for tokenB
  // const EOAtokenBBalanceCheck = await tokenBContract.balanceOf(wallet);
  // console.log("Token B - Balance on EOA", EOAtokenBBalanceCheck);

  // //Approve Controller to transfer Token B (EOA - via Controller to Vault)
  // const approveBTx = await tokenBContract.approve(
  //   controllerAddress,
  //   amountIn[1],
  //   {
  //     gasLimit: 500000,
  //   }
  // );
  // console.log(
  //   "Approve token B to be spent by Controller transaction sent:",
  //   approveBTx.hash
  // );

  // const approveBReceipt = await approveBTx.wait();
  // console.log(
  //   "Approve token B to be spent by Controller transaction mined:",
  //   approveBReceipt.transactionHash
  // );

  // //Check the Controller allowance for Token B
  // const controllerAllowanceTokenB = await tokenBContract.allowance(
  //   wallet.address,
  //   controllerAddress
  // );
  // console.log(
  //   "Controller allowance from EOA for Token B",
  //   controllerAllowanceTokenB
  // );

  //Transfer Token B from EOA to Controller
  const transferBTx = await tokenBContract.transfer(
    controllerAddress,
    amountIn[1]
  );
  console.log(
    "Transfer of Token B to Controller transaction sent:",
    transferBTx.hash
  );

  const transferReceiptB = await transferBTx.wait();
  console.log(
    "Transfer of Token B to Controller transaction mined:",
    transferReceiptB.transactionHash
  );

  const controllerTokenBBalanceCheck = await tokenBContract.balanceOf(
    controllerAddress
  );
  console.log(
    "Token B - Controller contract balance of token B",
    controllerTokenBBalanceCheck
  );

  //Controller approve Vault to transfer TokenB
  const vaultTokenBFromContoller = await controllerContract.approveVault(
    tokenB,
    amountIn[1]
  );
  console.log(
    "Controller approved Vault to transfer Token B",
    vaultTokenBFromContoller
  );

  //Check the Vault allowance for Token B from Controller
  const vaultAllowanceTokenB = await tokenBContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    "Vault allowance for Token B from Controller",
    vaultAllowanceTokenB
  );

  // Sending the function call to the contract
  const poolID = await controllerContract.getPoolId();
  //   await txResponse.wait();
  console.log("Controller get PoolID ", poolID);

  const poolSpecialization = await controllerContract.getPoolSpecialization();
  console.log("Pool Specialization: ", poolSpecialization);

  const joinExitEnabled = await controllerContract.getJoinExitEnabled();
  console.log("Join Exit Enabled: ", joinExitEnabled);

  const swapEnabled = await controllerContract.getSwapEnabled();
  console.log("Swap Enabled: ", swapEnabled);

  //Check if Swap's are disabled for the managed pool
  if (!swapEnabled) {
    const setJoinExitEnabled = await controllerContract.setJoinExitEnabled(
      true,
      {
        gasLimit: 500000,
      }
    );
    await setJoinExitEnabled.wait();
    console.log(
      "Set Join Exit Enabled: ",
      await controllerContract.getJoinExitEnabled()
    );
  }
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
    //[tokenA, tokenB],
    addresses,
    amountIn,
    { gasLimit: 500000 } // Set the gas limit for the transaction
  );
  await initPool.wait();
  console.log("Init Pool: ", initPool.hash);
}

try {
  contollerLP();
} catch (err) {
  console.log(err);
}
// Path: examples/controller/01_checkController.ts
