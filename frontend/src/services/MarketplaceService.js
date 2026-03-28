import { createPublicClient, http, parseAbi, parseEther, fallback } from 'viem';
import { polygon } from 'viem/chains';
import { getContract } from 'viem';

const MARKETPLACE_ADDRESS = import.meta.env.VITE_NFT_MARKETPLACE_ADDRESS || '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A';

const publicClient = createPublicClient({
  chain: polygon,
  transport: fallback([
    http('https://polygon-bor-rpc.publicnode.com'),
    http('https://polygon.drpc.org'),
    http('https://1rpc.io/matic')
  ])
});

const MARKETPLACE_ABI = parseAbi([
  'function listNFT(address nftContract, uint256 tokenId, uint256 amount, uint256 price, address paymentToken, bool isERC1155) external returns (uint256)',
  'function buyNFT(uint256 listingId) external payable',
  'function buyNFTWithSwap(uint256 listingId, address tokenIn, uint256 amountIn, uint256 minAmountOut) external payable',
  'function listings(uint256) view returns (uint256 listingId, address seller, address nftContract, uint256 tokenId, uint256 amount, uint256 price, address paymentToken, bool isActive, bool isERC1155)',
  'function listingCount() view returns (uint256)',
  'event NFTListed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price)',
  'event NFTSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price)'
]);

const MarketplaceService = {
  async getListing(listingId) {
    try {
      const data = await publicClient.readContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'listings',
        args: [BigInt(listingId)]
      });
      return {
        listingId: data[0].toString(),
        seller: data[1],
        nftContract: data[2],
        tokenId: data[3].toString(),
        amount: data[4].toString(),
        price: data[5].toString(),
        paymentToken: data[6],
        isActive: data[7],
        isERC1155: data[8]
      };
    } catch (err) {
      console.error('[MARKETPLACE] Error fetching listing:', err);
      return null;
    }
  },

  async getAllActiveListings() {
    try {
      const count = await publicClient.readContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'listingCount'
      });

      const listings = [];
      for (let i = 1; i <= Number(count); i++) {
        const listing = await this.getListing(i);
        if (listing && listing.isActive) {
          listings.push(listing);
        }
      }
      return listings;
    } catch (err) {
      console.error('[MARKETPLACE] Error fetching all listings:', err);
      return [];
    }
  },

  /**
   * Acquisition Logic
   */
  getAcquisitionParams(listing, walletClient) {
    return {
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'buyNFT',
      args: [BigInt(listing.listingId)],
      value: listing.paymentToken === '0x0000000000000000000000000000000000000000' ? BigInt(listing.price) : 0n,
      account: walletClient.account
    };
  },

  getSwapAcquisitionParams(listing, tokenIn, amountIn, minAmountOut, walletClient) {
    return {
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'buyNFTWithSwap',
      args: [BigInt(listing.listingId), tokenIn, BigInt(amountIn), BigInt(minAmountOut)],
      value: tokenIn === '0x0000000000000000000000000000000000000000' ? BigInt(amountIn) : 0n,
      account: walletClient.account
    };
  }
};

export default MarketplaceService;
