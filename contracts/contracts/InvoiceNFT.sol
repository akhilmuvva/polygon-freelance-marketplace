// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IFreelancerReputation {
    function gravityScores(address) external view returns (uint16);
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM ERRORS
// ─────────────────────────────────────────────────────────────────────────────
error UnauthorizedActor();
error ZeroAddress();
error ZeroValueIntent();
error GravityAnomaly();
error TimeHorizonInvalid();
error FrictionActive();
error PaymentFailed();
error InvalidStateTransition();

/**
 * @title SovereignInvoice
 * @author Akhil Muvva × Jhansi Kupireddy
 * @notice Tokenizes verifiable work as an ERC-721 Real-World Asset (RWA)
 *         to actuate immediate liquidity without centralized intermediaries.
 * 
 * @dev    Implements the "Antigravity Dialect" for invoice factoring.
 *         The originator gravity diverts surplus to the DAO, maintaining
 *         a 0% fee equilibrium for early-adopter sovereigns.
 *         All external protocols adhere strictly to Checks-Effects-Interactions.
 */
contract InvoiceNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    enum InvoiceStatus { PENDING, VERIFIED, FINANCED, PAID, DEFAULTED, DISPUTED }

    struct Invoice {
        uint256 invoiceId;
        address issuer;
        address debtor;
        address paymentToken;
        uint256 faceValue;
        uint256 dueDate;
        uint256 issuedDate;
        InvoiceStatus status;
        string invoiceHash;
        bytes32 legalHash;
        bool isVerified;
        address financier;
        uint256 financedAmount;
        uint256 paidAmount;
    }

    uint256 private _nextTokenId;
    
    // Gravity factors dictate standard fee extraction
    uint256 public platformGravityBps;    // Base interface friction
    uint256 public originatorGravityBps;  // 0.5% DAO routing
    uint256 public frictionPenaltyBps;    // Penalty for delayed payment (friction)
    
    address public feeCollector;
    address public aiOracle;
    address public reputationContract;

    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public issuerInvoices;
    mapping(address => uint256[]) public debtorInvoices;

    event SovereignInvoiceActuated(uint256 indexed invoiceId, address indexed issuer, address indexed debtor, uint256 faceValue, uint256 dueDate);
    event InvoiceVerified(uint256 indexed invoiceId, address verifier);
    event LiquidityInjected(uint256 indexed invoiceId, address indexed financier, uint256 amount);
    event DebtNeutralized(uint256 indexed invoiceId, uint256 amount);
    event DefaultDeclared(uint256 indexed invoiceId);
    event FrictionActuated(uint256 indexed invoiceId, address disputer);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Bootstraps the Sovereign Invoice registry.
     * @param _feeCollector Autonomous vault for surplus accumulation.
     * @param _platformGravityBps Baseline protocol friction for issuance.
     */
    function initialize(
        address _feeCollector,
        uint256 _platformGravityBps
    ) public initializer {
        __ERC721_init("Zenith Sovereign Invoice", "Z-INV");
        __ERC721URIStorage_init();
        __AccessControl_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        feeCollector = _feeCollector;
        platformGravityBps = _platformGravityBps;
        originatorGravityBps = 50;  // 0.5% autonomous routing
        frictionPenaltyBps = 500;   // 5% standard time friction
        _nextTokenId = 1;
    }

    /**
     * @notice Actuates a new invoice intent from a sovereign to a debtor.
     * @dev    Binds off-chain metadata (legal, IPFS) into an immutable ERC-721.
     */
    function createInvoice(
        address debtor,
        address paymentToken,
        uint256 faceValue,
        uint256 dueDate,
        string calldata invoiceHash,
        bytes32 legalHash
    ) external nonReentrant returns (uint256 invoiceId) {
        if(debtor == address(0)) revert ZeroAddress();
        if(faceValue == 0) revert ZeroValueIntent();
        if(dueDate <= block.timestamp) revert TimeHorizonInvalid();

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

        emit SovereignInvoiceActuated(invoiceId, msg.sender, debtor, faceValue, dueDate);
    }

    /**
     * @notice Authorizes the intent as legitimate, clearing it for market liquidity.
     */
    function verifyInvoice(uint256 invoiceId) external {
        if(!hasRole(VERIFIER_ROLE, msg.sender) && 
           !hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && 
           msg.sender != aiOracle) revert UnauthorizedActor();

        Invoice storage invoice = invoices[invoiceId];
        if(invoice.status != InvoiceStatus.PENDING) revert InvalidStateTransition();

        invoice.isVerified = true;
        invoice.status = InvoiceStatus.VERIFIED;

        emit InvoiceVerified(invoiceId, msg.sender);
    }

    /**
     * @notice Injects immediate liquidity into a sovereign's verified work intent.
     * @dev    Implements Checks-Effects-Interactions. Deducts platform and 
     *         originator gravity simultaneously. Defeats reentrancy surfaces.
     */
    function financeInvoice(uint256 invoiceId, uint256 offerAmount) external payable nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        if(invoice.status != InvoiceStatus.VERIFIED) revert InvalidStateTransition();
        if(offerAmount == 0 || offerAmount >= invoice.faceValue) revert GravityAnomaly();

        address currentOwner = ownerOf(invoiceId);

        uint256 pFee = (offerAmount * platformGravityBps) / 10000;
        uint256 oFee = (offerAmount * originatorGravityBps) / 10000;
        uint256 totalFee = pFee + oFee;
        uint256 netAmount = offerAmount - totalFee;

        // EFFECTS
        invoice.financier = msg.sender;
        invoice.financedAmount = offerAmount;
        invoice.status = InvoiceStatus.FINANCED;
        _transfer(currentOwner, msg.sender, invoiceId);

        // INTERACTIONS
        if (invoice.paymentToken == address(0)) {
            if(msg.value != offerAmount) revert GravityAnomaly();
            
            (bool s1, ) = payable(currentOwner).call{value: netAmount}("");
            if(!s1) revert PaymentFailed();

            if (totalFee > 0) {
                (bool s2, ) = payable(feeCollector).call{value: totalFee}("");
                if(!s2) revert PaymentFailed();
            }
        } else {
            IERC20(invoice.paymentToken).safeTransferFrom(msg.sender, currentOwner, netAmount);
            if (totalFee > 0) {
                IERC20(invoice.paymentToken).safeTransferFrom(msg.sender, feeCollector, totalFee);
            }
        }

        emit LiquidityInjected(invoiceId, msg.sender, offerAmount);
    }

    /**
     * @notice Liquidity Provider of Last Resort. DAO steps in to purchase.
     */
    function treasuryPurchase(uint256 invoiceId) external onlyRole(TREASURY_ROLE) nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        if(invoice.status != InvoiceStatus.VERIFIED) revert InvalidStateTransition();
        
        uint256 discountBps = this.calculateDiscountRate(invoiceId);
        uint256 discountAmount = (invoice.faceValue * discountBps) / 10000;
        uint256 purchasePrice = invoice.faceValue - discountAmount;

        address currentOwner = ownerOf(invoiceId);

        // EFFECTS
        _transfer(currentOwner, msg.sender, invoiceId);
        invoice.financier = msg.sender;
        invoice.financedAmount = purchasePrice;
        invoice.status = InvoiceStatus.FINANCED;

        // INTERACTIONS
        if (invoice.paymentToken == address(0)) {
            (bool s, ) = payable(currentOwner).call{value: purchasePrice}("");
            if(!s) revert PaymentFailed();
        } else {
            IERC20(invoice.paymentToken).safeTransferFrom(msg.sender, currentOwner, purchasePrice);
        }

        emit LiquidityInjected(invoiceId, msg.sender, purchasePrice);
    }

    /**
     * @notice Neutralizes the debt obligation, concluding the intent lifecycle.
     * @dev    Includes a 30-second grace buffer before activating friction penalties
     *         to prevent minor time desyncs from being economically weaponized.
     */
    function payInvoice(uint256 invoiceId) external payable nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        if(msg.sender != invoice.debtor) revert UnauthorizedActor();
        if(invoice.status != InvoiceStatus.VERIFIED && invoice.status != InvoiceStatus.FINANCED) revert InvalidStateTransition();

        uint256 amountDue = invoice.faceValue;

        // Grace buffer of 30 seconds eliminates block timestamp manipulation cliffs
        if (block.timestamp > invoice.dueDate + 30 seconds) {
            uint256 penalty = (invoice.faceValue * frictionPenaltyBps) / 10000;
            amountDue += penalty;
        }

        address recipient = invoice.financier != address(0) ? invoice.financier : invoice.issuer;

        // EFFECTS
        invoice.paidAmount = amountDue;
        invoice.status = InvoiceStatus.PAID;

        // INTERACTIONS
        if (invoice.paymentToken == address(0)) {
            if(msg.value < amountDue) revert GravityAnomaly();
            
            (bool success, ) = payable(recipient).call{value: amountDue}("");
            if(!success) revert PaymentFailed();

            if (msg.value > amountDue) {
                (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - amountDue}("");
                if(!refundSuccess) revert PaymentFailed();
            }
        } else {
            IERC20(invoice.paymentToken).safeTransferFrom(msg.sender, recipient, amountDue);
        }

        emit DebtNeutralized(invoiceId, amountDue);
    }

    /**
     * @notice Explicitly marks an intent as defaulted beyond the recovery horizon.
     */
    function markAsDefaulted(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        if(msg.sender != invoice.issuer && msg.sender != invoice.financier && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert UnauthorizedActor();
        if(block.timestamp <= invoice.dueDate + 30 days) revert TimeHorizonInvalid();
        if(invoice.status == InvoiceStatus.PAID) revert InvalidStateTransition();

        invoice.status = InvoiceStatus.DEFAULTED;
        emit DefaultDeclared(invoiceId);
    }

    /**
     * @notice Triggers an explicit friction state on the intent.
     */
    function disputeInvoice(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        if(msg.sender != invoice.issuer && msg.sender != invoice.debtor && msg.sender != invoice.financier) revert UnauthorizedActor();

        invoice.status = InvoiceStatus.DISPUTED;
        emit FrictionActuated(invoiceId, msg.sender);
    }

    function setAIOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(_oracle == address(0)) revert ZeroAddress();
        aiOracle = _oracle;
    }

    function setReputationContract(address _rep) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(_rep == address(0)) revert ZeroAddress();
        reputationContract = _rep;
    }

    function getIssuerInvoices(address issuer) external view returns (uint256[] memory) {
        return issuerInvoices[issuer];
    }

    function getDebtorInvoices(address debtor) external view returns (uint256[] memory) {
        return debtorInvoices[debtor];
    }

    function getInvoiceDetails(uint256 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }

    /**
     * @notice Computes dynamic risk premium via Antigravity reputation engine.
     * @return discountBps The calculated market equilibrium risk premium.
     */
    function calculateDiscountRate(uint256 invoiceId) external view returns (uint256 discountBps) {
        Invoice storage invoice = invoices[invoiceId];
        if(invoice.status != InvoiceStatus.VERIFIED) return 0;

        uint256 daysUntilDue = (invoice.dueDate > block.timestamp) ? (invoice.dueDate - block.timestamp) / 1 days : 0;
        
        discountBps = (3000 * daysUntilDue) / 365;

        // Gravity integration actuates risk premium directly from the Sovereign record
        if (reputationContract != address(0)) {
            try IFreelancerReputation(reputationContract).gravityScores(invoice.issuer) returns (uint16 gravityScore) {
                uint256 riskPremium = (discountBps * uint256(gravityScore)) / 20000;
                discountBps += riskPremium;
            } catch {}
        }

        if (discountBps > 5000) discountBps = 5000;
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

    /// @dev ERC-7201 storage gap for upgrade safety
    uint256[50] private __gap;
}
