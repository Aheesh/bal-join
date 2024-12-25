import * as dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import controllerABI from '../abi/Controller.json';

const providerApiKey = process.env.BASE_PROVIDER_API_KEY;
if (!providerApiKey) throw new Error("BASE_PROVIDER_API_KEY environment variable is not set");

export default async function getPoolTokenBalance() {
    const provider = new ethers.providers.JsonRpcProvider(`https://base-mainnet.g.alchemy.com/v2/${providerApiKey}`);
    const CONTROLLER_ADDRESS = "0x835309AED8B04C52Fe0dAF35D90F7e5f9A7472Bd";
    
    try {
        const controllerContract = new ethers.Contract(CONTROLLER_ADDRESS, controllerABI.abi, provider);
        const [tokens, balances, lastChangeBlock] = await controllerContract.getPoolTokens();
        
        const result = {
            tokens,
            balances: balances.map((b: ethers.BigNumber) => ethers.utils.formatEther(b)),
            lastChangeBlock: lastChangeBlock.toString()
        };

        // If running as standalone script, log the results
        if (require.main === module) {
            console.log("Token Addresses:", result.tokens);
            console.log("Token Balances:", result.balances);
            console.log("Last Change Block:", result.lastChangeBlock);
        }

        return result;
    } catch (error) {
        console.error("Error fetching pool tokens:", error);
        throw error;
    }
}

// Run main function if file is run directly
if (require.main === module) {
    getPoolTokenBalance()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Main function error:", error);
            process.exit(1);
        });
}
