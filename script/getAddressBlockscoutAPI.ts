import axios from 'axios';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

// Constants
const TOKENS = {
    PLAYER_A: '0xaA4eC2d86E61632E88Db93cf6D2a42E5f458DC99',
    PLAYER_B: '0xe96891F2d3838Bfbbce1285e0913b195acc935c5',
    DRAW: '0x62A52757b580e7FD97203bD0408a7445741b5D5f',
};

interface TokenBalance {
    address: string;
    balance: string;
}

async function getTokenHolders(tokenAddress: string): Promise<TokenBalance[]> {
    try {
        const url = `https://base.blockscout.com/api/v2/tokens/${tokenAddress}/holders`;
        console.log(`\nFetching holders for ${tokenAddress}`);
        
        const response = await axios.get(url);
        
        if (!response.data?.items) {
            console.log(`No data received for token ${tokenAddress}`);
            return [];
        }
        
        console.log('First holder raw data:', response.data.items[0]);
        console.log('First holder keys:', Object.keys(response.data.items[0]));
        
        const holders = response.data.items.map((holder: any) => ({
            address: holder.address.hash,
            balance: ethers.utils.formatUnits(holder.value, 18)
        }));

        // Log holders details
        holders.forEach((holder: TokenBalance) => {
            console.log(`Address: ${holder.address} | Balance: ${holder.balance}`);
        });

        return holders;
    } catch (error: any) {
        console.error(`Error fetching holders for token ${tokenAddress}:`, error);
        return [];
    }
}

async function main() {
    try {
        // Get holders for each token
        const [playerAHolders, playerBHolders, drawHolders] = await Promise.all([
            getTokenHolders(TOKENS.PLAYER_A),
            getTokenHolders(TOKENS.PLAYER_B),
            getTokenHolders(TOKENS.DRAW)
        ]);

        console.log('\nPlayer A Token Holders:', playerAHolders.length);
        console.log('Addresses:');
        playerAHolders.forEach(h => console.log(`${h.address} (Balance: ${h.balance})`));

        console.log('\nPlayer B Token Holders:', playerBHolders.length);
        console.log('Addresses:');
        playerBHolders.forEach(h => console.log(`${h.address} (Balance: ${h.balance})`));

        console.log('\nDraw Token Holders:', drawHolders.length);
        console.log('Addresses:');
        drawHolders.forEach(h => console.log(`${h.address} (Balance: ${h.balance})`));

        // Optional: Get unique addresses across all tokens
        const allAddresses = new Set([
            ...playerAHolders.map(h => h.address),
            ...playerBHolders.map(h => h.address),
            ...drawHolders.map(h => h.address)
        ]);

        console.log('\nTotal unique addresses:', allAddresses.size);

        // Optional: Save to file
        const fs = require('fs');
        fs.writeFileSync(
            'token-holders.json',
            JSON.stringify({
                playerA: playerAHolders,
                playerB: playerBHolders,
                draw: drawHolders,
                uniqueAddresses: Array.from(allAddresses)
            }, null, 2)
        );

    } catch (error) {
        console.error('Error in main:', error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
