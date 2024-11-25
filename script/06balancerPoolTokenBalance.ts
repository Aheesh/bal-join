import * as dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import controllerABI from '../abi/Controller.json';

// Load API key from environment variable
const providerApiKey = process.env.BASE_PROVIDER_API_KEY;
if (!providerApiKey) throw new Error("BASE_PROVIDER_API_KEY environment variable is not set");

async function main() {
    // Setup provider (assuming you're using Ethereum mainnet)
    const provider = new ethers.providers.JsonRpcProvider(`https://base-mainnet.g.alchemy.com/v2/${providerApiKey}`);
    
    // Controller contract address
    const CONTROLLER_ADDRESS = "0x835309AED8B04C52Fe0dAF35D90F7e5f9A7472Bd";
    
    try {
        // Initialize contract
        const controllerContract = new ethers.Contract(CONTROLLER_ADDRESS, controllerABI.abi, provider);
        
        // Call getPoolTokens without any parameters
        const [tokens, balances, lastChangeBlock] = await controllerContract.getPoolTokens();
        
        console.log("Token Addresses:", tokens);
        console.log("Token Balances:", balances.map((b: ethers.BigNumber) => ethers.utils.formatEther(b)));
        console.log("Last Change Block:", lastChangeBlock.toString());
        
    } catch (error) {
        console.error("Error fetching pool tokens:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Main function error:", error);
        process.exit(1);
    });
