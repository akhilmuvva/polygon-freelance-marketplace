// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PolyLanceNFTMarketplace
 * @notice A premium marketplace for PolyLance assets (Job NFTs, Invoices, Service NFTs).
 * @author Antigravity (Enhanced for PolyLance Zenith)
 */
contract PolyLanceNFTMarketplace is 
    Initializable, 
    AccessControlUpgradeable, 
    ReentrancyGuard, 
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 amount; // 1 for ERC721, >1 for ERC1155
        uint256 price;
        address paymentToken; // address(0) for MATIC
        bool isActive;
        bool isERC1155;
    }

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;
    
    uint256 public platformFeeBps; // e.g., 250 for 2.5%
    address public feeRecipient;
    address public swapManager;

    interface ISwapManager {
        function swap(
            address tokenIn,
            address tokenOut,
            uint256 amountIn,
            uint256 minAmountOut,
            address recipient
        ) external payable returns (uint256 amountOut);
    }

    event NFTListed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price);
    event NFTSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event FeeUpdated(uint256 newFee);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin, address _feeRecipient, uint256 _feeBps) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        feeRecipient = _feeRecipient;
        platformFeeBps = _feeBps;
    }

    /**
     * @notice Lists an NFT for sale.
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        address paymentToken,
        bool isERC1155
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be > 0");
        require(amount > 0, "Amount must be > 0");

        if (isERC1155) {
            require(IERC1155(nftContract).balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
            require(IERC1155(nftContract).isApprovedForAll(msg.sender, address(this)), "Not approved");
        } else {
            require(amount == 1, "ERC721 amount must be 1");
            require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");
            require(
                IERC721(nftContract).getApproved(tokenId) == address(this) || 
                IERC721(nftContract).isApprovedForAll(msg.sender, address(this)), 
                "Not approved"
            );
        }

        uint256 listingId = ++listingCount;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: amount,
            price: price,
            paymentToken: paymentToken,
            isActive: true,
            isERC1155: isERC1155
        });

        emit NFTListed(listingId, msg.sender, nftContract, tokenId, price);
        return listingId;
    }

    /**
     * @notice Buys an listed NFT using a different token by swapping it first.
     */
    function buyNFTWithSwap(
        uint256 listingId,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external payable nonReentrant {
        require(swapManager != address(0), "Swap manager not set");
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");

        if (tokenIn != address(0)) {
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
            IERC20(tokenIn).forceApprove(swapManager, amountIn);
        }

        uint256 amountOut = ISwapManager(swapManager).swap{value: tokenIn == address(0) ? msg.value : 0}(
            tokenIn,
            listing.paymentToken,
            amountIn,
            minAmountOut,
            address(this)
        );

        require(amountOut >= listing.price, "Insufficient swap output");

        // Use the internal purchase logic or just proceed
        _executePurchase(listingId, msg.sender, amountOut);
    }

    function _executePurchase(uint256 listingId, address buyer, uint256 providedAmount) internal {
        Listing storage listing = listings[listingId];
        listing.isActive = false;

        uint256 fee = (listing.price * platformFeeBps) / 10000;
        uint256 sellerProceeds = listing.price - fee;

        if (listing.paymentToken == address(0)) {
            if (fee > 0) {
                (bool fS, ) = payable(feeRecipient).call{value: fee}("");
                require(fS, "Fee transfer failed");
            }
            (bool sS, ) = payable(listing.seller).call{value: sellerProceeds}("");
            require(sS, "Seller transfer failed");

            if (providedAmount > listing.price) {
                (bool rS, ) = payable(buyer).call{value: providedAmount - listing.price}("");
                require(rS, "Refund failed");
            }
        } else {
            if (fee > 0) {
                IERC20(listing.paymentToken).safeTransfer(feeRecipient, fee);
            }
            IERC20(listing.paymentToken).safeTransfer(listing.seller, sellerProceeds);

            if (providedAmount > listing.price) {
                IERC20(listing.paymentToken).safeTransfer(buyer, providedAmount - listing.price);
            }
        }

        if (listing.isERC1155) {
            IERC1155(listing.nftContract).safeTransferFrom(listing.seller, buyer, listing.tokenId, listing.amount, "");
        } else {
            IERC721(listing.nftContract).safeTransferFrom(listing.seller, buyer, listing.tokenId);
        }

        emit NFTSold(listingId, buyer, listing.seller, listing.price);
    }

    /**
     * @notice Buys an listed NFT.
     */
    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(msg.sender != listing.seller, "Cannot buy own NFT");

        if (listing.paymentToken == address(0)) {
            require(msg.value >= listing.price, "Insufficient MATIC");
            _executePurchase(listingId, msg.sender, msg.value);
        } else {
            IERC20(listing.paymentToken).safeTransferFrom(msg.sender, address(this), listing.price);
            _executePurchase(listingId, msg.sender, listing.price);
        }
    }

    /**
     * @notice Cancels a listing.
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender || hasRole(MANAGER_ROLE, msg.sender), "Not authorized");
        require(listing.isActive, "Listing already inactive");

        listing.isActive = false;
        emit ListingCancelled(listingId);
    }

    function setPlatformFee(uint256 _bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_bps <= 2000, "Fee too high"); // max 20%
        platformFeeBps = _bps;
        emit FeeUpdated(_bps);
    }

    function setFeeRecipient(address _recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_recipient != address(0), "Zero address");
        feeRecipient = _recipient;
    }

    function setSwapManager(address _swapManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        swapManager = _swapManager;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    // Support for receiving ERC1155
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
