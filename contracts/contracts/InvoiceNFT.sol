// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title InvoiceNFT
 * @notice Tokenizes invoices as NFTs for invoice financing and factoring
 * @dev Each NFT represents a unique invoice that can be sold/financed at a discount
 */
interface IFreelancerReputation {
    function gravityScores(address) external view returns (uint16);
}

contract InvoiceNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuard,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    enum InvoiceStatus { PENDING, VERIFIED, FINANCED, PAID, DEFAULTED, DISPUTED }

    /**
     * @notice Structure representing an invoice NFT
     */
    struct Invoice {
        uint256 invoiceId;            // NFT token ID
        address issuer;               // Freelancer/service provider
        address debtor;               // Client who owes payment
        address paymentToken;         // Token for payment (address(0) for native)
        uint256 faceValue;            // Full invoice amount
        uint256 dueDate;              // Payment due date
        uint256 issuedDate;           // When invoice was created
        InvoiceStatus status;         // Current status
        string invoiceHash;           // IPFS hash of invoice document
        bytes32 legalHash;            // Hash of legal agreement
        bool isVerified;              // Verified by oracle/admin
        address financier;            // Who purchased the invoice (if financed)
        uint256 financedAmount;       // Amount paid by financier
        uint256 paidAmount;           // Amount paid by debtor
    }

    // State variables
    uint256 private _nextTokenId;
    uint256 public platformFeeBps;      // Platform fee in basis points
    uint256 public defaultPenaltyBps;   // Penalty for late payment
    address public feeCollector;
    address public aiOracle;
    address public reputationContract;

    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public issuerInvoices;
    mapping(address => uint256[]) public debtorInvoices;

    // Events
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed issuer,
        address indexed debtor,
        uint256 faceValue,
        uint256 dueDate
    );
    event InvoiceVerified(uint256 indexed invoiceId, address verifier);
    event InvoiceFinanced(uint256 indexed invoiceId, address indexed financier, uint256 amount);
    event InvoicePaid(uint256 indexed invoiceId, uint256 amount);
    event InvoiceDefaulted(uint256 indexed invoiceId);
    event InvoiceDisputed(uint256 indexed invoiceId, address disputer);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the InvoiceNFT contract
     * @param _feeCollector Address to receive platform fees
     * @param _platformFeeBps Platform fee in basis points
     */
    function initialize(
        address _feeCollector,
        uint256 _platformFeeBps
    ) public initializer {
        __ERC721_init("Invoice NFT", "INVOICE");
        __ERC721URIStorage_init();
        __AccessControl_init();



        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        feeCollector = _feeCollector;
        platformFeeBps = _platformFeeBps;
        defaultPenaltyBps = 500; // 5% default penalty
        _nextTokenId = 1;
    }

    /**
     * @notice Creates a new invoice NFT
     * @param debtor Client who owes payment
     * @param paymentToken Token for payment
     * @param faceValue Full invoice amount
     * @param dueDate Payment due date
     * @param invoiceHash IPFS hash of invoice document
     * @param legalHash Hash of legal agreement
     * @return invoiceId The newly created invoice NFT ID
     */
    function createInvoice(
        address debtor,
        address paymentToken,
        uint256 faceValue,
        uint256 dueDate,
        string calldata invoiceHash,
        bytes32 legalHash
    ) external nonReentrant returns (uint256 invoiceId) {
        require(debtor != address(0), "InvoiceNFT: Invalid debtor");
        require(faceValue > 0, "InvoiceNFT: Zero value");
        require(dueDate > block.timestamp, "InvoiceNFT: Invalid due date");

        invoiceId = _nextTokenId++;

        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            issuer: msg.sender,
            debtor: debtor,
            paymentToken: paymentToken,
            faceValue: faceValue,
            dueDate: dueDate,
            issuedDate: block.timestamp,
            status: InvoiceStatus.PENDING,
            invoiceHash: invoiceHash,
            legalHash: legalHash,
            isVerified: false,
            financier: address(0),
            financedAmount: 0,
            paidAmount: 0
        });

        issuerInvoices[msg.sender].push(invoiceId);
        debtorInvoices[debtor].push(invoiceId);

        _safeMint(msg.sender, invoiceId);
        _setTokenURI(invoiceId, invoiceHash);

        emit InvoiceCreated(invoiceId, msg.sender, debtor, faceValue, dueDate);
    }

    /**
     * @notice Verifies an invoice (by oracle or admin)
     * @param invoiceId The invoice NFT ID
     */
    function verifyInvoice(uint256 invoiceId) external {
        require(
            hasRole(VERIFIER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || msg.sender == aiOracle,
            "InvoiceNFT: Not authorized"
        );

        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.PENDING, "InvoiceNFT: Invalid status");

        invoice.isVerified = true;
        invoice.status = InvoiceStatus.VERIFIED;

        emit InvoiceVerified(invoiceId, msg.sender);
    }

    /**
     * @notice Finances an invoice (purchases it at a discount)
     * @param invoiceId The invoice NFT ID
     * @param offerAmount Amount willing to pay (less than face value)
     */
    function financeInvoice(uint256 invoiceId, uint256 offerAmount) external payable nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.VERIFIED, "InvoiceNFT: Not verified");
        require(invoice.isVerified, "InvoiceNFT: Not verified");
        require(offerAmount > 0 && offerAmount < invoice.faceValue, "InvoiceNFT: Invalid offer");

        address currentOwner = ownerOf(invoiceId);

        // Transfer payment to current owner (issuer)
        if (invoice.paymentToken == address(0)) {
            require(msg.value == offerAmount, "InvoiceNFT: Incorrect value");
            
            uint256 fee = (offerAmount * platformFeeBps) / 10000;
            uint256 netAmount = offerAmount - fee;

            (bool success1, ) = payable(currentOwner).call{value: netAmount}("");
            require(success1, "InvoiceNFT: Transfer failed");

            if (fee > 0) {
                (bool success2, ) = payable(feeCollector).call{value: fee}("");
                require(success2, "InvoiceNFT: Fee transfer failed");
            }
        } else {
            uint256 fee = (offerAmount * platformFeeBps) / 10000;
            uint256 netAmount = offerAmount - fee;

            IERC20(invoice.paymentToken).safeTransferFrom(msg.sender, currentOwner, netAmount);
            if (fee > 0) {
                IERC20(invoice.paymentToken).safeTransferFrom(msg.sender, feeCollector, fee);
            }
        }

        // Transfer NFT to financier
        _transfer(currentOwner, msg.sender, invoiceId);

        invoice.financier = msg.sender;
        invoice.financedAmount = offerAmount;
        invoice.status = InvoiceStatus.FINANCED;

        emit InvoiceFinanced(invoiceId, msg.sender, offerAmount);
    }

    /**
     * @notice Zenith Treasury "Liquidity Provider of Last Resort" (Feature C)
     * @dev Allows the DAO to purchase verified invoices instantly.
     */
    function treasuryPurchase(uint256 invoiceId) external onlyRole(TREASURY_ROLE) nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.VERIFIED, "InvoiceNFT: Not verified");
        
        uint256 discountBps = this.calculateDiscountRate(invoiceId);
        uint256 discountAmount = (invoice.faceValue * discountBps) / 10000;
        uint256 purchasePrice = invoice.faceValue - discountAmount;

        address currentOwner = ownerOf(invoiceId);

        if (invoice.paymentToken == address(0)) {
            // Treasury must have native balance in the contract or we use transfer
            (bool s, ) = payable(currentOwner).call{value: purchasePrice}("");
            require(s, "InvoiceNFT: Treasury transfer failed");
        } else {
            IERC20(invoice.paymentToken).safeTransferFrom(msg.sender, currentOwner, purchasePrice);
        }

        _transfer(currentOwner, msg.sender, invoiceId);
        invoice.financier = msg.sender;
        invoice.financedAmount = purchasePrice;
        invoice.status = InvoiceStatus.FINANCED;

        emit InvoiceFinanced(invoiceId, msg.sender, purchasePrice);
    }

    /**
     * @notice Pays an invoice (by debtor)
     * @param invoiceId The invoice NFT ID
     */
    function payInvoice(uint256 invoiceId) external payable nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        require(msg.sender == invoice.debtor, "InvoiceNFT: Not debtor");
        require(
            invoice.status == InvoiceStatus.VERIFIED || invoice.status == InvoiceStatus.FINANCED,
            "InvoiceNFT: Invalid status"
        );

        uint256 amountDue = invoice.faceValue;

        // Apply late penalty if past due date
        if (block.timestamp > invoice.dueDate) {
            uint256 penalty = (invoice.faceValue * defaultPenaltyBps) / 10000;
            amountDue += penalty;
        }

        address recipient = invoice.financier != address(0) ? invoice.financier : invoice.issuer;

        if (invoice.paymentToken == address(0)) {
            require(msg.value >= amountDue, "InvoiceNFT: Insufficient payment");
            
            (bool success, ) = payable(recipient).call{value: amountDue}("");
            require(success, "InvoiceNFT: Transfer failed");

            // Refund excess
            if (msg.value > amountDue) {
                (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - amountDue}("");
                require(refundSuccess, "InvoiceNFT: Refund failed");
            }
        } else {
            IERC20(invoice.paymentToken).safeTransferFrom(msg.sender, recipient, amountDue);
        }

        invoice.paidAmount = amountDue;
        invoice.status = InvoiceStatus.PAID;

        emit InvoicePaid(invoiceId, amountDue);
    }

    /**
     * @notice Marks invoice as defaulted (if past due and unpaid)
     * @param invoiceId The invoice NFT ID
     */
    function markAsDefaulted(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        require(
            msg.sender == invoice.issuer || msg.sender == invoice.financier || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "InvoiceNFT: Not authorized"
        );
        require(block.timestamp > invoice.dueDate + 30 days, "InvoiceNFT: Not yet defaulted");
        require(invoice.status != InvoiceStatus.PAID, "InvoiceNFT: Already paid");

        invoice.status = InvoiceStatus.DEFAULTED;
        emit InvoiceDefaulted(invoiceId);
    }

    /**
     * @notice Disputes an invoice
     * @param invoiceId The invoice NFT ID
     */
    function disputeInvoice(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        require(
            msg.sender == invoice.issuer || msg.sender == invoice.debtor || msg.sender == invoice.financier,
            "InvoiceNFT: Not authorized"
        );

        invoice.status = InvoiceStatus.DISPUTED;
        emit InvoiceDisputed(invoiceId, msg.sender);
    }

    /**
     * @notice Sets the AI oracle address
     * @param _oracle AI oracle contract
     */
    function setAIOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        aiOracle = _oracle;
    }

    /**
     * @notice Sets the reputation contract address
     * @param _rep Reputation contract
     */
    function setReputationContract(address _rep) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reputationContract = _rep;
    }

    /**
     * @notice Returns all invoices issued by an address
     * @param issuer The issuer address
     */
    function getIssuerInvoices(address issuer) external view returns (uint256[] memory) {
        return issuerInvoices[issuer];
    }

    /**
     * @notice Returns all invoices owed by an address
     * @param debtor The debtor address
     */
    function getDebtorInvoices(address debtor) external view returns (uint256[] memory) {
        return debtorInvoices[debtor];
    }

    /**
     * @notice Returns invoice details
     * @param invoiceId The invoice NFT ID
     */
    function getInvoiceDetails(uint256 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }

    /**
     * @notice Calculates the current discount rate for financing
     * @param invoiceId The invoice NFT ID
     * @return discountBps Discount in basis points
     */
    function calculateDiscountRate(uint256 invoiceId) external view returns (uint256 discountBps) {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.VERIFIED, "InvoiceNFT: Not verified");

        uint256 daysUntilDue = (invoice.dueDate > block.timestamp) ? (invoice.dueDate - block.timestamp) / 1 days : 0;
        
        // Base linear discount: 1% per 30 days
        discountBps = (3000 * daysUntilDue) / 365;

        // Apply Antigravity Risk Adjustment (Gravity Score)
        if (reputationContract != address(0)) {
            try IFreelancerReputation(reputationContract).gravityScores(invoice.issuer) returns (uint16 gravityScore) {
                // Higher Gravity Score = Higher Risk = Higher Yield required by arbitrageurs
                // Increase discount by up to 50% extra based on gravity (gravity is 0-10000)
                uint256 riskPremium = (discountBps * uint256(gravityScore)) / 20000;
                discountBps += riskPremium;
            } catch {}
        }

        if (discountBps > 5000) discountBps = 5000; // Cap at 50%
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
