import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import contractABI from "../abi/Controller.json";
import managedPoolABI from "../abi/ManagedPool.json";

async function contollerTokenState() {
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

  const balancerManagedPoolToken = addresses[2];
  console.log("BPToken Managed Pool: ", balancerManagedPoolToken);

  const bptContract = new ethers.Contract(
    balancerManagedPoolToken,
    managedPoolABI.abi,
    wallet
  );

  //Check balance of tokenA with EOA
  const controllerBPTBalanceCheck = await bptContract.balanceOf(
    controllerAddress
  );
  console.log("bpt Token Balance", controllerBPTBalanceCheck);
}
try {
  contollerTokenState();
} catch (err) {
  console.log(err);
}
