// This script is used to transfer tokens from the deployer to the wallet 2. 
//The current version transfers 1000 stable tokens divided equallto the wallet 2, 3 and 4.
import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import contractABI from "../abi/Controller.json";
// import tokenAABI from "../abi/PlayerAToken.json";
// import tokenBABI from "../abi/PlayerBToken.json";
// import tokenDrawABI from "../abi/DrawToken.json";
import tokenStableABI from "../abi/tokenStable.json";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function swapToken() {
  // parse arguments for network
  const argv = yargs(hideBin(process.argv))
    .option("network", {
      type: "string",
      description: "The network to connect to",
      default: "localhost",
      demandOption: true,
    })
    .parseSync();

  console.log(`Network: , ${argv.network}`);
  const network = argv.network;

  const providerApiKey = process.env.ALCHEMY_API_KEY;

  // create a new provider
  const provider = new ethers.providers.JsonRpcProvider(
    network === "sepolia"
      ? `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`
      : "http://127.0.0.1:8545/"
  );

  // get the signer account
  const pvtKey = process.env.ACCOUNT1_KEY;
  const pvtKey2 = process.env.ACCOUNT2_KEY;
  const pvtKey3 = process.env.ACCOUNT3_KEY;
  const pvtKey4 = process.env.ACCOUNT4_KEY;
  if (!pvtKey || !pvtKey2 || !pvtKey3 || !pvtKey4) {
    throw new Error("ACCOUNT_KEY(s) is not set");
  }
  //Get the EOA wallets
  const wallet = new ethers.Wallet(pvtKey, provider);
  const wallet2 = new ethers.Wallet(pvtKey2, provider);
  const wallet3 = new ethers.Wallet(pvtKey3, provider);
  const wallet4 = new ethers.Wallet(pvtKey4, provider);
  const amountIn = (BigInt("100000000000000000000") / BigInt(3)).toString();

  // get the address of the signer
  const signerAddress = await wallet.getAddress();
  console.log("Signer address:", signerAddress);

  // get the address of the signer 2
  const signerAddress2 = await wallet2.getAddress();
  console.log("Signer address 2:", signerAddress2);

  // get the address of the signer 3
  const signerAddress3 = await wallet3.getAddress();
  console.log("Signer address 3:", signerAddress3);

  // get the address of the signer 4
  const signerAddress4 = await wallet4.getAddress();
  console.log("Signer address 4:", signerAddress4);

  //Controller Contract Address
  const controllerAddress = "0xa313187690af88B0f78e76Df5B4c2Ce089639c01";
  const controllerContract = new ethers.Contract(
    controllerAddress,
    contractABI.abi,
    wallet
  );
  //Get the tokens in the managed pool contract
  const [addresses, balance, lastUpdatedBlock] =
    await controllerContract.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);
  console.log("Pool Tokens Amounts: ", balance);
  console.log("Last updated block: ", lastUpdatedBlock);

  // const tokenA = addresses[3];
  // console.log("Token A: ", tokenA);

  // const tokenB = addresses[2];
  // console.log("Token B: ", tokenB);

  // const tokenDraw = addresses[4];
  // console.log("Token Draw: ", tokenDraw);

  const tokenStable = addresses[4];
  console.log("Stable Token:", tokenStable);

  //load token contract token Stable

  const tokenStableContract = new ethers.Contract(
    tokenStable,
    tokenStableABI.abi,
    wallet
  );

  // Transfer to multiple wallets
  const wallets = [wallet2, wallet3, wallet4];
  
  for (const wallet of wallets) {
    const transferStableTx = await tokenStableContract.transfer(
      wallet.address,
      amountIn, // 100 Token Stable each
      {
        gasLimit: 500000,
      }
    );
    console.log(
      `Transfer of token Stable to ${wallet.address} transaction sent:`,
      transferStableTx.hash
    );

    const transferReceiptStable = await transferStableTx.wait();
    console.log(
      `Transfer of Token Stable to ${wallet.address} transaction mined:`,
      transferReceiptStable.transactionHash
    );

    const walletBalance = await tokenStableContract.balanceOf(wallet.address);
    console.log(
      `Token Stable - Balance of TokenStable with ${wallet.address}:`,
      walletBalance
    );
  }
}

try {
  swapToken();
} catch (err) {
  console.log(err);
}
