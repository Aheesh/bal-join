import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import contractABI from "../abi/Controller.json";
import tokenAABI from "../abi/PlayerAToken.json";
import tokenBABI from "../abi/PlayerBToken.json";
import tokenDrawABI from "../abi/DrawToken.json";
import tokenStableABI from "../abi/StableToken.json";

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
  const controllerAddress = "0xe8D526e39F0Ac69D489816c23615104bB969820C";
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

  const tokenA = addresses[2];
  console.log("Token A: ", tokenA);

  const tokenB = addresses[3];
  console.log("Token B: ", tokenB);

  const tokenDraw = addresses[1];
  console.log("Token Draw: ", tokenDraw);

  const tokenStable = addresses[4];
  console.log("Stable Token:", tokenStable);

  //load token contract token Stable

  const tokenStableContract = new ethers.Contract(
    tokenStable,
    tokenStableABI.abi,
    wallet
  );

  //transfer tokenA from Wallet 1 to Wallet 2
  const transferStableTx = await tokenStableContract.transfer(
    wallet2.address,
    "1000000000000000000", // 1 Token Stable
    {
      gasLimit: 500000,
    }
  );
  console.log(
    "Transfer of token Stable to EOA 2 transaction sent:",
    transferStableTx.hash
  );

  const transferReceiptStable = await transferStableTx.wait();
  console.log(
    "Transfer of Token Stable to EOA 2 transaction mined:",
    transferReceiptStable.transactionHash
  );

  const wallet2TokenStableBalanceCheck = await tokenStableContract.balanceOf(
    wallet2.address
  );
  console.log(
    "Token Stable - Balance of TokenStable with EOA 2 ",
    wallet2TokenStableBalanceCheck
  );
}

try {
  swapToken();
} catch (err) {
  console.log(err);
}
