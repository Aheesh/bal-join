import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import contractABI from "../abi/Controller.json";
import tokenAABI from "../abi/PlayerAToken.json";
import tokenBABI from "../abi/PlayerBToken.json";

async function swapToken() {
  // create a new provider
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545/"
  );
  // get the signer account
  const pvtKey = process.env.ACCOUNT1_KEY;
  const pvtKey2 = process.env.ACCOUNT2_KEY;
  if (!pvtKey || !pvtKey2) {
    throw new Error("ACCOUNT_KEY is not set");
  }
  //Get the EOA wallets
  const wallet = new ethers.Wallet(pvtKey, provider);
  const wallet2 = new ethers.Wallet(pvtKey2, provider);
  const amountIn = "1000000000000000000";

  // get the address of the signer
  const signerAddress = await wallet.getAddress();
  console.log("Signer address:", signerAddress);

  // get the address of the signer 2
  const signerAddress2 = await wallet2.getAddress();
  console.log("Signer address 2:", signerAddress2);

  //Controller Contract Address
  const controllerAddress = "0x86393d64dff5cb19455a6e8a7ce51cd6f92bc00c";
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

  //load token contract tokenA

  const tokenAContract = new ethers.Contract(tokenA, tokenAABI.abi, wallet);

  //transfer tokenA from Wallet 1 to Wallet 2
  const transferATx = await tokenAContract.transfer(
    wallet2.address,
    "1000000000000000000", // 1 Token A
    {
      gasLimit: 500000,
    }
  );
  console.log(
    "Transfer of token A to EOA 2 transaction sent:",
    transferATx.hash
  );

  const transferReceiptA = await transferATx.wait();
  console.log(
    "Transfer of Token A to EOA 2 transaction mined:",
    transferReceiptA.transactionHash
  );

  const wallet2TokenABalanceCheck = await tokenAContract.checkBalance(
    wallet2.address
  );
  console.log(
    "TokenA - Balance of TokenA with EOA 2 ",
    wallet2TokenABalanceCheck
  );
  //Load token Contract - token B
  const tokenBContract = new ethers.Contract(tokenB, tokenBABI.abi, wallet);

  //Transfer Token B from Wallet 1 to Wallet 2
  const transferBTx = await tokenBContract.transfer(
    wallet2.address,
    "1000000000000000000", // 1 Token B
    {
      gasLimit: 500000,
    }
  );
  console.log(
    "Transfer of Token B to Wallet 2 transaction sent:",
    transferBTx.hash
  );

  const transferReceiptB = await transferBTx.wait();
  console.log(
    "Transfer of Token B to Wallet 2 transaction mined:",
    transferReceiptB.transactionHash
  );

  const wallet2TokenBBalanceCheck = await tokenBContract.balanceOf(
    wallet2.address
  );
  console.log(
    "Token B - Wallet 2 balance of token B",
    wallet2TokenBBalanceCheck
  );
}

try {
  swapToken();
} catch (err) {
  console.log(err);
}
