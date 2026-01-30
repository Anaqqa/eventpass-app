export const CONTRACT_ABI = [
  // Events
  "event TicketPurchased(uint256 indexed tokenId, address indexed buyer, uint8 ticketType, uint256 price)",
  "event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event TicketResold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price)",
  "event TicketValidated(uint256 indexed tokenId, address indexed owner)",
  "event TicketPriceUpdated(uint8 indexed ticketType, uint256 newPrice)",

  // Main Functions
  "function buyTicket(uint8 ticketType, string tokenURI) payable",
  "function listForResale(uint256 tokenId, uint256 price)",
  "function buyResale(uint256 listingId) payable",
  "function validateAndBurn(uint256 tokenId)",

  // View Functions
  "function getTicketPrice(uint8 ticketType) view returns (uint256)",
  "function canTransact(address user) view returns (bool)",
  "function canTransfer(uint256 tokenId) view returns (bool)",
  "function getListing(uint256 listingId) view returns (uint256 tokenId, address seller, uint256 price, bool isActive)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
] as const;

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

export enum TicketType {
  EARLY_BIRD = 0,
  STANDARD = 1,
  PREMIUM = 2,
  VIP = 3,
}

export const TICKET_PRICES_ETH: Record<TicketType, string> = {
  [TicketType.EARLY_BIRD]: "0.08",
  [TicketType.STANDARD]: "0.10",
  [TicketType.PREMIUM]: "0.15",
  [TicketType.VIP]: "0.25",
};

export const TICKET_NAMES: Record<TicketType, string> = {
  [TicketType.EARLY_BIRD]: "🌟 EARLY BIRD",
  [TicketType.STANDARD]: "🎫 STANDARD",
  [TicketType.PREMIUM]: "💎 PREMIUM",
  [TicketType.VIP]: "👑 VIP",
};
