import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import contractABI from "../abi/Controller.json";
import tokenAABI from "../abi/PlayerAToken.json";
import tokenBABI from "../abi/PlayerBToken.json";
import tokenDrawABI from "../abi/DrawToken.json";

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

  const amountIn = [
    "300000000000000000",
    "100000000000000000",
    "600000000000000000",
  ];

  //Controller Contract Address
  const controllerAddress = "0xd1c6df03c4c0a2260721d08db4c26a009dc68149";
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

  const tokenA = addresses[0];
  console.log("Token A: ", tokenA);

  const tokenB = addresses[2];
  console.log("Token B: ", tokenB);

  const tokenDraw = addresses[1];
  console.log("Token Draw: ", tokenDraw);

  //get the vaultID
  const vaultID = await controllerContract.getVault();
  console.log("VaultID check response ", vaultID);

  //load token contract tokenA
  const tokenAContract = new ethers.Contract(tokenA, tokenAABI.abi, wallet);

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

  //Load token Contract - token B
  const tokenBContract = new ethers.Contract(tokenB, tokenBABI.abi, wallet);

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

  //DrawToken
  //load token contract tokenDraw
  const tokenDrawContract = new ethers.Contract(
    tokenDraw,
    tokenDrawABI.abi,
    wallet
  );

  //Transfer Token Draw from EOA to Controller
  const transferDrawTx = await tokenDrawContract.transfer(
    controllerAddress,
    amountIn[2] // 1 Token Draw
  );
  console.log(
    "Transfer of Token Draw to Controller transaction sent:",
    transferDrawTx.hash
  );

  const transferReceiptDraw = await transferDrawTx.wait();
  console.log(
    "Transfer of Token Draw to Controller transaction mined:",
    transferReceiptDraw.transactionHash
  );

  const controllerTokenDrawBalanceCheck = await tokenDrawContract.balanceOf(
    controllerAddress
  );
  console.log(
    "Token Draw - Controller contract balance of token Draw",
    controllerTokenDrawBalanceCheck
  );

  //Controller approve Vault to transfer TokenB
  const vaultTokenDrawFromContoller = await controllerContract.approveVault(
    tokenDraw,
    amountIn[2] // 1 Token Draw
  );
  console.log(
    "Controller approved Vault to transfer Token Draw",
    vaultTokenDrawFromContoller
  );

  //Check the Vault allowance for Token B from Controller
  const vaultAllowanceTokenDraw = await tokenDrawContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    "Vault allowance for Token Draw from Controller",
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

  const initPool = await controllerContract.initPool(
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
