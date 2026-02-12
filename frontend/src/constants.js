// Network Configuration
const IS_AMOY = true; // Toggle for deployment

export const CONTRACT_ADDRESS = IS_AMOY
    ? '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A'
    : '0x38c76A767d45Fc390160449948aF80569E2C4217';

export const SUPPORTED_TOKENS = [
    { symbol: 'MATIC', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    { symbol: 'USDC', address: IS_AMOY ? '0x41e94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' : '0x41e94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', decimals: 6 },
    { symbol: 'DAI', address: '0x001B68356E62095104ee17672f101d2959E73fF3', decimals: 18 },
];

export const CHAINLINK_PRICE_FEEDS = {
    MATIC: '0x001382149eBa3441043c1c66972b4772963f5D43', // Amoy MATIC/USD
};

export const PRICE_FEED_ABI = [
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            { "internalType": "uint80", "name": "roundId", "type": "uint80" },
            { "internalType": "int256", "name": "answer", "type": "int256" },
            { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
            { "internalType": "uint256", "name": "updatedAt", "type": "uint256" },
            { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

export const POLY_TOKEN_ADDRESS = IS_AMOY
    ? '0xd3b893cd083f07Fe371c1a87393576e7B01C52C6'
    : '0xd3b893cd083f07Fe371c1a87393576e7B01C52C6';

export const REPUTATION_ADDRESS = IS_AMOY
    ? '0x89791A9A3210667c828492DB98DCa3e2076cc373'
    : '0xDC57724Ea354ec925BaFfCA0cCf8A1248a8E5CF1';

export const GOVERNANCE_ADDRESS = IS_AMOY
    ? '0x4653251486a57f90Ee89F9f34E098b9218659b83'
    : '0x4653251486a57f90Ee89F9f34E098b9218659b83';

export const CROSS_CHAIN_GOVERNOR_ADDRESS = IS_AMOY
    ? '0x0000000000000000000000000000000000000000' // Placeholder - deploy if needed
    : '0x0000000000000000000000000000000000000000';
