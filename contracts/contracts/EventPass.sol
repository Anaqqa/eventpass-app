// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EventPass
 * @dev NFT-based ticketing system with anti-scalping measures
 */
contract EventPass is ERC721URIStorage, Ownable {
    
    // ============ STATE VARIABLES ============
    
    uint256 private _tokenIds;
    
    // Ticket types and prices (in wei)
    enum TicketType { EARLY_BIRD, STANDARD, PREMIUM, VIP }
    mapping(TicketType => uint256) public ticketPrices;
    
    // Business rules tracking
    mapping(address => uint256) public lastTransactionTime;  // Cooldown tracking
    mapping(uint256 => uint256) public purchaseTime;         // Lock tracking
    mapping(uint256 => uint256) public transferCount;        // Max 1 resale
    mapping(uint256 => uint256) public initialPrice;         // For +20% limit
    mapping(uint256 => TicketType) public ticketTypes;       // Ticket metadata
    
    // Resale marketplace
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }
    mapping(uint256 => Listing) public listings;
    uint256 private _listingIds;
    
    // Constants
    uint256 public constant MAX_TICKETS_PER_WALLET = 4;
    uint256 public constant COOLDOWN_PERIOD = 5 minutes;
    uint256 public constant LOCK_PERIOD = 10 minutes;
    uint256 public constant MAX_RESALE_MARKUP = 120; // 120% = original + 20%
    
    // ============ EVENTS ============
    
    event TicketPurchased(
        address indexed buyer,
        uint256 indexed tokenId,
        TicketType ticketType,
        uint256 price
    );
    
    event TicketListed(
        address indexed seller,
        uint256 indexed tokenId,
        uint256 price
    );
    
    event TicketResold(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        uint256 price
    );
    
    event TicketValidated(
        uint256 indexed tokenId,
        address indexed validator
    );
    
    // ============ CONSTRUCTOR ============
    
    constructor() ERC721("EventPass", "EVTP") Ownable(msg.sender) {
        // Initialize ticket prices (in wei)
        ticketPrices[TicketType.EARLY_BIRD] = 0.08 ether;  // 80 EUR equivalent
        ticketPrices[TicketType.STANDARD] = 0.1 ether;     // 100 EUR
        ticketPrices[TicketType.PREMIUM] = 0.15 ether;     // 150 EUR
        ticketPrices[TicketType.VIP] = 0.25 ether;         // 250 EUR
    }
    
    // ============ MODIFIERS ============
    
    modifier respectsCooldown(address user) {
        require(
            block.timestamp >= lastTransactionTime[user] + COOLDOWN_PERIOD,
            "Cooldown period not elapsed"
        );
        _;
    }
    
    modifier respectsMaxTickets(address user) {
        require(
            balanceOf(user) < MAX_TICKETS_PER_WALLET,
            "Max 4 tickets per wallet"
        );
        _;
    }
    
    modifier respectsLockPeriod(uint256 tokenId) {
        require(
            block.timestamp >= purchaseTime[tokenId] + LOCK_PERIOD,
            "Ticket locked for 10 minutes after purchase"
        );
        _;
    }
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @dev Buy a new ticket (primary sale)
     * @param ticketType Type of ticket (0=EARLY_BIRD, 1=STANDARD, 2=PREMIUM, 3=VIP)
     * @param tokenURI IPFS URI containing ticket metadata
     */
    function buyTicket(
        TicketType ticketType,
        string memory tokenURI
    ) 
        external 
        payable 
        respectsCooldown(msg.sender)
        respectsMaxTickets(msg.sender)
        returns (uint256)
    {
        uint256 price = ticketPrices[ticketType];
        require(msg.value >= price, "Insufficient payment");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Track business rules
        purchaseTime[newTokenId] = block.timestamp;
        lastTransactionTime[msg.sender] = block.timestamp;
        initialPrice[newTokenId] = price;
        ticketTypes[newTokenId] = ticketType;
        transferCount[newTokenId] = 0;
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit TicketPurchased(msg.sender, newTokenId, ticketType, price);
        
        return newTokenId;
    }
    
    /**
     * @dev List a ticket for resale
     * @param tokenId ID of the ticket to sell
     * @param price Resale price (must be <= initial price * 1.2)
     */
    function listForResale(
        uint256 tokenId,
        uint256 price
    ) 
        external 
        respectsLockPeriod(tokenId)
    {
        require(ownerOf(tokenId) == msg.sender, "Not ticket owner");
        require(transferCount[tokenId] < 1, "Ticket already resold once");
        
        uint256 maxPrice = (initialPrice[tokenId] * MAX_RESALE_MARKUP) / 100;
        require(price <= maxPrice, "Price exceeds 20% markup limit");
        
        _listingIds++;
        listings[_listingIds] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit TicketListed(msg.sender, tokenId, price);
    }
    
    /**
     * @dev Buy a ticket from resale marketplace
     * @param listingId ID of the listing
     */
    function buyResale(uint256 listingId) 
        external 
        payable
        respectsCooldown(msg.sender)
        respectsMaxTickets(msg.sender)
    {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        
        uint256 tokenId = listing.tokenId;
        address seller = listing.seller;
        
        // Update business rules
        transferCount[tokenId]++;
        lastTransactionTime[msg.sender] = block.timestamp;
        purchaseTime[tokenId] = block.timestamp; // Reset lock for new owner
        
        // Deactivate listing
        listing.active = false;
        
        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);
        
        // Transfer payment to seller
        payable(seller).transfer(listing.price);
        
        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit TicketResold(seller, msg.sender, tokenId, listing.price);
    }
    
    /**
     * @dev Validate and burn ticket at event entrance
     * @param tokenId ID of the ticket to validate
     */
    function validateAndBurn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not ticket owner");
        
        emit TicketValidated(tokenId, msg.sender);
        
        _burn(tokenId);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get ticket price by type
     */
    function getTicketPrice(TicketType ticketType) external view returns (uint256) {
        return ticketPrices[ticketType];
    }
    
    /**
     * @dev Check if user can perform transaction (cooldown check)
     */
    function canTransact(address user) external view returns (bool) {
        return block.timestamp >= lastTransactionTime[user] + COOLDOWN_PERIOD;
    }
    
    /**
     * @dev Check if ticket can be transferred (lock check)
     */
    function canTransfer(uint256 tokenId) external view returns (bool) {
        return block.timestamp >= purchaseTime[tokenId] + LOCK_PERIOD;
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update ticket prices (owner only)
     */
    function updateTicketPrice(TicketType ticketType, uint256 newPrice) external onlyOwner {
        ticketPrices[ticketType] = newPrice;
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
