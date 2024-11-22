import 'dotenv/config';
import { BalancerSDK, Network } from '@balancer-labs/sdk';
import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import axios from 'axios';

// Configuration
const POOL_ID = '0xc8503e1a4e439800dea3424cbfc085cbeb6c3bfe000100000000000000000172';
const TOKENS = {
  PLAYER_A: '0xaA4eC2d86E61632E88Db93cf6D2a42E5f458DC99',
  PLAYER_B: '0xe96891F2d3838Bfbbce1285e0913b195acc935c5',
  DRAW: '0x62A52757b580e7FD97203bD0408a7445741b5D5f',
  DEGEN: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'
};

// ERC20 ABI for balance checks
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const providerApiKey = process.env.BASE_PROVIDER_API_KEY; 
console.log('Provider API Key:', providerApiKey); 
 // Get provider
 const provider = new ethers.providers.JsonRpcProvider(`https://base-mainnet.g.alchemy.com/v2/${providerApiKey}`);

async function fetchPoolInfoWithRetry(balancer: BalancerSDK, poolId: string, retries = 5) {
    let attempt = 0;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt < retries) {
        try {
            console.log('Fetching pool information...');
            const pool = await balancer.pools.find(poolId);
            if (!pool) {
                throw new Error(`Pool not found: ${poolId}`);
            }
            return pool;
        } catch (error: any) {
            if (error.response && error.response.status === 429) {
                attempt++;
                const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`Rate limit hit, retrying in ${waitTime / 1000} seconds...`);
                await delay(waitTime);
            } else {
                throw error; // Re-throw if it's not a rate limit error
            }
        }
    }
    throw new Error('Failed to fetch pool information after multiple attempts');
}

async function getPoolAndTokenInfo(addressesToCheck: string[]) {
  try {
    // Initialize Balancer SDK
    const config = {
      network: Network.BASE,
      rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${providerApiKey}`,
    };
    const balancer = new BalancerSDK(config);

    const pool = await fetchPoolInfoWithRetry(balancer, POOL_ID);
    
    console.log('\nPool Information:');
    console.log('Total Liquidity:', pool.totalLiquidity);
    

    // 2. Get Token Balances in Pool
    console.log('\nToken Balances in Pool:');
    for (const token of pool.tokens) {
      console.log(`${token.symbol}: ${token.balance}`);
    }

    // 3. Get Top Token Holders
    console.log('\nFetching token holder balances...');
    
    // Create contract instances
    const tokenContracts = {
      PLAYER_A: new ethers.Contract(TOKENS.PLAYER_A, ERC20_ABI, provider),
      PLAYER_B: new ethers.Contract(TOKENS.PLAYER_B, ERC20_ABI, provider),
      DRAW: new ethers.Contract(TOKENS.DRAW, ERC20_ABI, provider)
    };

    // Get token information and balances
    for (const [tokenName, contract] of Object.entries(tokenContracts)) {
      console.log(`\n${tokenName} Token Holder Balances:`);
      
      const decimals = await contract.decimals();
      const symbol = await contract.symbol();

      for (const address of addressesToCheck) {
        const balance = await contract.balanceOf(address);
        const formattedBalance = formatUnits(balance, decimals);
        console.log(`Address ${address}: ${formattedBalance} ${symbol}`);
      }
    }

    // 4. Get Pool Specific Metrics
    console.log('\nPool Metrics:');
    console.log('Swap Fee:', pool.swapFee);
    console.log('APR:', pool.apr);

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function getTokenHolders(tokenContract: ethers.Contract, fromBlock: number) {
    const holders = new Set<string>();
    const BLOCK_RANGE = 100000;
    
    // Get current block
    const latestBlock = await provider.getBlockNumber();
    console.log(`Scanning from block ${fromBlock} to ${latestBlock}`);
    
    // Query in chunks
    for (let startBlock = fromBlock; startBlock <= latestBlock; startBlock += BLOCK_RANGE) {
        const endBlock = Math.min(startBlock + BLOCK_RANGE - 1, latestBlock);
        
        console.log(`Processing blocks ${startBlock} to ${endBlock}...`);
        
        try {
            const transferEvents = await tokenContract.queryFilter(
                tokenContract.filters.Transfer(),
                startBlock,
                endBlock
            );
            
            console.log(`Found ${transferEvents.length} transfer events`);
            
            // Process events in batches to avoid too many concurrent RPC calls
            const batchSize = 50;
            for (let i = 0; i < transferEvents.length; i += batchSize) {
                const batch = transferEvents.slice(i, i + batchSize);
                await Promise.all(batch.map(async (event) => {
                    const [from, to] = event.args! as [string, string, ethers.BigNumber];
                    
                    const [fromBalance, toBalance] = await Promise.all([
                        tokenContract.balanceOf(from),
                        tokenContract.balanceOf(to)
                    ]);
                    
                    if (fromBalance.eq(0)) {
                        holders.delete(from);
                    } else {
                        holders.add(from);
                    }
                    
                    if (toBalance.gt(0)) {
                        holders.add(to);
                    }
                }));
            }
            
            console.log(`Current unique holders: ${holders.size}`);
        } catch (error) {
            console.error(`Error processing blocks ${startBlock}-${endBlock}:`, error);
        }
    }
    
    return Array.from(holders);
}

// First, set up your token contracts
const playerAContract = new ethers.Contract(TOKENS.PLAYER_A, ERC20_ABI, provider);
const playerBContract = new ethers.Contract(TOKENS.PLAYER_B, ERC20_ABI, provider);
const drawContract = new ethers.Contract(TOKENS.DRAW, ERC20_ABI, provider);

// You might want to set a reasonable fromBlock, perhaps when tokens were deployed
const fromBlock = 20065380; // Replace with actual deployment block

// Fetch all holders
async function getAllHolders() {
    try {
        console.log('Fetching token holders...');
        
        const [playerAHolders, playerBHolders, drawHolders] = await Promise.all([
            getTokenHolders(playerAContract, fromBlock),
            getTokenHolders(playerBContract, fromBlock),
            getTokenHolders(drawContract, fromBlock)
        ]);

        // Combine all unique addresses
        const allHolders = [...new Set([
            ...playerAHolders,
            ...playerBHolders,
            ...drawHolders
        ])];

        console.log(`Found ${allHolders.length} unique holders`);
        console.log(`Player A holders: ${playerAHolders.length}`);
        console.log(`Player B holders: ${playerBHolders.length}`);
        console.log(`Draw holders: ${drawHolders.length}`);

        return allHolders;
    } catch (error) {
        console.error('Error fetching holders:', error);
        return [];
    }
}

async function main() {
    const addressesToCheck = await getAllHolders();
    console.log('Addresses to check:', addressesToCheck); 
    //await getPoolAndTokenInfo(addressesToCheck);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });