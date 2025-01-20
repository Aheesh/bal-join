import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import contractABI from "../abi/Controller.json";
import tokenAABI from "../abi/PlayerAToken.json";
import tokenBABI from "../abi/PlayerBToken.json";
import tokenDrawABI from "../abi/DrawToken.json";
import tokenStableABI from "../abi/tokenStable.json";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function contollerLP() {
  const argv = yargs(hideBin(process.argv))
    .option("network", {
      type: "string",
      description: "The network to connect to",
      default: "localhost",
      demandOption: true,
    })
    .parseSync();

  console.log(`Network: ${argv.network}`);
  const network = argv.network;

  const providerApiKey = process.env.ALCHEMY_API_KEY;
  const providerBaseKey = process.env.BASE_PROVIDER_API_KEY;

  // create a new provider
  const provider = new ethers.providers.JsonRpcProvider(
    network === "sepolia"
      ? `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`
      : network === "base"
      ? `https://base-mainnet.g.alchemy.com/v2/${providerBaseKey}`
      : "http://127.0.0.1:8545/"
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
   const controllerAddress = "0xaE0b23C9a28Ab1959D2a7cc5117bB5c65246ff06";
   const controllerContract = new ethers.Contract(
     controllerAddress,
     contractABI.abi,
     wallet
   );

  //TODO refactor from here onwards to use the info from the pool info.
  // The amount in array position and loop to check balance, transfer to controller and approve vault.
  const [addresses, balance, totalBalance] = await controllerContract.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);

  // Get token positions by fetching symbols
  let tokenA, tokenB, tokenDraw, tokenStable;
  let tokenPositions: {
    tokenA?: number;
    tokenB?: number;
    tokenDraw?: number;
    tokenStable?: number;
  } = {};

  for (let i = 0; i < addresses.length; i++) {
    const tokenContract = new ethers.Contract(addresses[i], tokenAABI.abi, wallet);
    const symbol = await tokenContract.symbol();
    
    switch(symbol) {
      case "PA":
        tokenA = addresses[i];
        tokenPositions.tokenA = i;
        break;
      case "PB":
        tokenB = addresses[i];
        tokenPositions.tokenB = i;
        break;
      case "DT":
        tokenDraw = addresses[i];
        tokenPositions.tokenDraw = i;
        break;
      case "ST":
        tokenStable = addresses[i];
        tokenPositions.tokenStable = i;
        break;
    }
  }

  console.log("Token Positions:", tokenPositions);

  // Use positions for amountIn array
  const amountIn = new Array(addresses.length).fill("0");
  if (tokenPositions.tokenDraw !== undefined) amountIn[tokenPositions.tokenDraw] = "180000000000000000000";
  if (tokenPositions.tokenB !== undefined) amountIn[tokenPositions.tokenB] = "180000000000000000000";
  if (tokenPositions.tokenA !== undefined) amountIn[tokenPositions.tokenA] = "140000000000000000000";
  if (tokenPositions.tokenStable !== undefined) amountIn[tokenPositions.tokenStable] = "500000000000000000000";

  console.log("Token Addresses:", addresses);
  console.log("Token Amounts:", amountIn);
  console.log("Controller Balances:");
  for (let i = 0; i < addresses.length; i++) {
    const token = new ethers.Contract(addresses[i], tokenAABI.abi, provider);
    const balance = await token.balanceOf(controllerAddress);
    console.log(`Token ${i}: ${ethers.utils.formatUnits(balance, 18)}`);
  }

  //get the vaultID
  const vaultID = await controllerContract.getVault();
  console.log("VaultID check response ", vaultID);

  //load token contract tokenA
  const tokenAContract = new ethers.Contract(tokenA, tokenAABI.abi, wallet);

  //Check the Vault allowance for Token A from Controller
  let vaultAllowanceTokenA = await tokenAContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    `Vault allowance for TokenA from Controller : hex value %s , decimal value %s`,
    vaultAllowanceTokenA.toHexString(),
    BigInt(vaultAllowanceTokenA.toHexString()).toString()
  );

  //To prevent multiple approvals of Token A and transfer to Controller
  if (BigInt(vaultAllowanceTokenA.toHexString()) < BigInt(tokenPositions.tokenA !== undefined ? amountIn[tokenPositions.tokenA] : "0")) {
    //transfer tokenA to Controller
    const transferATx = await tokenAContract.transfer(
      controllerAddress,
      tokenPositions.tokenA !== undefined ? amountIn[tokenPositions.tokenA] : "0",
      {
        gasLimit: 500000,
      }
    );
    console.log(
      "Transfer of token A to Controller transaction sent:%s amount:%s",
      transferATx.hash,
      tokenPositions.tokenA !== undefined ? amountIn[tokenPositions.tokenA] : "0"
    );

    const transferReceiptA = await transferATx.wait();
    console.log(
      "Transfer of Token A to Controller transaction mined:",
      transferReceiptA.transactionHash
    );

    const controllerTokenABalanceCheck = await tokenAContract.balanceOf(
      controllerAddress
    );
    console.log(
      "TokenA - Balance of TokenA with controller contract ",
      controllerTokenABalanceCheck
    );

    //Controller approve Vault to transfer TokenA
    const vaultTokenAFromContoller = await controllerContract.approveVault(
      tokenA,
      tokenPositions.tokenA !== undefined ? amountIn[tokenPositions.tokenA] : "0"
    );
  }
  //Check the Vault allowance for Token A from Controller
  vaultAllowanceTokenA = await tokenAContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    `Vault allowance for TokenA from Controller : hex value %s , decimal value %s`,
    vaultAllowanceTokenA.toHexString(),
    BigInt(vaultAllowanceTokenA.toHexString()).toString()
  );

  //Load token Contract - token B
  const tokenBContract = new ethers.Contract(tokenB, tokenBABI.abi, wallet);

  //Check the Vault allowance for Token B from Controller
  let vaultAllowanceTokenB = await tokenBContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    "Vault allowance for Token B from Controller",
    vaultAllowanceTokenB.toHexString(),
    BigInt(vaultAllowanceTokenB.toHexString())
  );

  if (BigInt(vaultAllowanceTokenB.toHexString()) < BigInt(tokenPositions.tokenB !== undefined ? amountIn[tokenPositions.tokenB] : "0")) {
    //Transfer Token B from EOA to Controller
    const transferBTx = await tokenBContract.transfer(
      controllerAddress,
      tokenPositions.tokenB !== undefined ? amountIn[tokenPositions.tokenB] : "0",
      {
        gasLimit: 500000,
      }
    );
    console.log(
      "Transfer of Token B to Controller transaction sent:%s amount:%s",
      transferBTx.hash,
      tokenPositions.tokenB !== undefined ? amountIn[tokenPositions.tokenB] : "0"
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
      tokenPositions.tokenB !== undefined ? amountIn[tokenPositions.tokenB] : "0"
    );
  }
  //Check the Vault allowance for Token B from Controller
  vaultAllowanceTokenB = await tokenBContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    "Vault allowance for Token B from Controller",
    vaultAllowanceTokenB
  );

  //DrawToken - load token contract
  const tokenDrawContract = new ethers.Contract(
    tokenDraw,
    tokenDrawABI.abi,
    wallet
  );

  //Check the Vault allowance for Token Draw from Controller
  let vaultAllowanceTokenDraw = await tokenDrawContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    "Vault allowance for Token Draw from Controller",
    vaultAllowanceTokenDraw.toHexString(),
    BigInt(vaultAllowanceTokenDraw.toHexString())
  );
  if (BigInt(vaultAllowanceTokenDraw.toHexString()) < BigInt(tokenPositions.tokenDraw !== undefined ? amountIn[tokenPositions.tokenDraw] : "0")) {
    //Transfer Token Draw from EOA to Controller
    const transferDrawTx = await tokenDrawContract.transfer(
      controllerAddress,
      tokenPositions.tokenDraw !== undefined ? amountIn[tokenPositions.tokenDraw] : "0"
    );
    console.log(
      "Transfer of Token Draw to Controller transaction sent:%s amount:%s",
      transferDrawTx.hash,
      tokenPositions.tokenDraw !== undefined ? amountIn[tokenPositions.tokenDraw] : "0"
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

    //Controller approve Vault to transfer Draw
    const vaultTokenDrawFromContoller = await controllerContract.approveVault(
      tokenDraw,
      tokenPositions.tokenDraw !== undefined ? amountIn[tokenPositions.tokenDraw] : "0"
    );
  }
  //Check the Vault allowance for Token Draw from Controller
  vaultAllowanceTokenDraw = await tokenDrawContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    "Vault allowance for Token Draw from Controller",
    vaultAllowanceTokenDraw.toHexString(),
    BigInt(vaultAllowanceTokenDraw.toHexString())
  );

  //StableToken
  //load token contract tokenDraw
  const tokenStableContract = new ethers.Contract(
    tokenStable,
    tokenStableABI.abi,
    wallet
  );

  //Check the Vault allowance for stable token from Controller
  let vaultAllowanceTokenStable = await tokenStableContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    "Vault allowance for Stable Token from Controller",
    vaultAllowanceTokenStable.toHexString(),
    BigInt(vaultAllowanceTokenStable.toHexString())
  );

  if (BigInt(vaultAllowanceTokenStable.toHexString()) < BigInt(tokenPositions.tokenStable !== undefined ? amountIn[tokenPositions.tokenStable] : "0")) {
    //Transfer Stable Token from EOA to Controller
    const transferStableTx = await tokenStableContract.transfer(
      controllerAddress,
      tokenPositions.tokenStable !== undefined ? amountIn[tokenPositions.tokenStable] : "0"
    );
    console.log(
      "Transfer of Token Stable to Controller transaction sent:%s amount:%s",
      transferStableTx.hash,
      tokenPositions.tokenStable !== undefined ? amountIn[tokenPositions.tokenStable] : "0"
    );

    const transferReceiptStable = await transferStableTx.wait();
    console.log(
      "Transfer of Token Stable to Controller transaction mined:",
      transferReceiptStable.transactionHash
    );

    const controllerTokenStableBalanceCheck =
      await tokenStableContract.balanceOf(controllerAddress);
    console.log(
      "Token Stable - Controller contract balance of token Draw",
      controllerTokenStableBalanceCheck
    );

    //Controller approve Vault to transfer Stable Token
    const vaultTokenStableFromContoller = await controllerContract.approveVault(
      tokenStable,
      tokenPositions.tokenStable !== undefined ? amountIn[tokenPositions.tokenStable] : "0"
    );
  }
  //Check the Vault allowance for stable token from Controller
  vaultAllowanceTokenStable = await tokenStableContract.allowance(
    controllerAddress,
    vaultID
  );
  console.log(
    "Vault allowance for Stable Token from Controller",
    vaultAllowanceTokenStable
  );

  // Debug logs before init
  console.log("\n=== Debug Info Before Init ===");
  
  // 1. Log Pool Configuration
  console.log("\nPool Configuration:");
  const poolID = await controllerContract.getPoolId();
  console.log("Pool ID:", poolID);
  const poolSpecialization = await controllerContract.getPoolSpecialization();
  console.log("Pool Specialization:", poolSpecialization);

  // 2. Log Token Order and Amounts
  console.log("\nToken Details:");
  for (let i = 0; i < addresses.length; i++) {
    const tokenContract = new ethers.Contract(addresses[i], tokenAABI.abi, provider);
    const [symbol, decimals, balance, allowance] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.balanceOf(controllerAddress),
      tokenContract.allowance(controllerAddress, vaultID)
    ]);
    
    console.log(`\nToken ${i + 1}:`);
    console.log(`- Address: ${addresses[i]}`);
    console.log(`- Symbol: ${symbol}`);
    console.log(`- Init Amount: ${ethers.utils.formatUnits(amountIn[i], decimals)}`);
    console.log(`- Controller Balance: ${ethers.utils.formatUnits(balance, decimals)}`);
    console.log(`- Vault Allowance: ${ethers.utils.formatUnits(allowance, decimals)}`);
  }

  // 3. Log Controller and Vault Status
  console.log("\nController Status:");
  const joinExitEnabled = await controllerContract.getJoinExitEnabled();
  const swapEnabled = await controllerContract.getSwapEnabled();
  console.log("Join/Exit Enabled:", joinExitEnabled);
  console.log("Swap Enabled:", swapEnabled);
  console.log("\n============================\n");

  // Create amounts array without [0] position
  const poolAmounts = amountIn.slice(1);  // Remove first amount

  console.log("\nPool Initialization Data:");
  console.log("Tokens:", addresses);
  console.log("Amounts:", poolAmounts);

  // Use addresses (unchanged) and filtered amounts for pool initialization
  const initPool = await controllerContract.initPool(
    addresses,
    poolAmounts,
    { gasLimit: 900010 }
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
