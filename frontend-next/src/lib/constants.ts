import { Address } from 'viem';

export const IS_AMOY = process.env.NEXT_PUBLIC_NETWORK === 'amoy' || true;

export const CONTRACT_ADDRESSES = {
  ESCROW: (IS_AMOY
    ? '0x5Ff3E1223B5c37f1C18CC279dfC9C181bF22BEf9'
    : '0x38c76A767d45Fc390160449948aF80569E2C4217') as Address,
  POLY_TOKEN: (IS_AMOY
    ? '0x31466D0Cb5D646741b675EDABe38dca8e0bfd078'
    : '0xd3b893cd083f07Fe371c1a87393576e7B01C52C6') as Address,
  REPUTATION: (IS_AMOY
    ? '0x6976ED34702D29e8605C4b57752a61FeAaC14eeF'
    : '0xDC57724Ea354ec925BaFfCA0cCf8A1248a8E5CF1') as Address,
  ZSO: '0x0000000000000000000000000000000000000000' as Address, // Deployment Pending
};

export const SUPPORTED_TOKENS = [
  { symbol: 'MATIC', address: '0x0000000000000000000000000000000000000000' as Address, decimals: 18 },
  { 
    symbol: 'USDC', 
    address: (IS_AMOY ? '0x41e94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' : '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359') as Address, 
    decimals: 6 
  },
  { 
    symbol: 'USDT', 
    address: (IS_AMOY ? '0x1D2aF960570bFc0861198A699435b54FC9056781' : '0xc2132D05D31c914a87C6611C10748AEb04B58e8F') as Address, 
    decimals: 6 
  },
];

export const EXPLORER_URL = IS_AMOY ? 'https://amoy.polygonscan.com' : 'https://polygonscan.com';
