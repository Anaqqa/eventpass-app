// frontend/src/lib/metadata.ts

export type BuildTicketInput = {
  eventName: string;
  tier: "EARLY_BIRD" | "STANDARD" | "PREMIUM" | "VIP";
  seatNumber?: string;
  venue?: string;
  dateISO?: string;
  valueEur?: number;
  ipfsDocumentHash?: string;
};

export function buildTicketMetadata(input: BuildTicketInput) {
  const {
    eventName,
    tier,
    seatNumber = "—",
    venue = "—",
    dateISO = new Date().toISOString(),
    valueEur,
    ipfsDocumentHash,
  } = input;

  return {
    name: `EventPass — ${eventName} (${tier})`,
    description: `Ticket NFT pour ${eventName}.`,
    image: "ipfs://bafkreihdummyimagecid", // si tu as une vraie image IPFS, remplace-la
    attributes: [
      { trait_type: "Tier", value: tier },
      { trait_type: "Seat", value: seatNumber },
      { trait_type: "Venue", value: venue },
      { trait_type: "Date", value: dateISO },
      ...(typeof valueEur === "number" ? [{ trait_type: "ValueEUR", value: valueEur }] : []),
      ...(ipfsDocumentHash ? [{ trait_type: "DocHash", value: ipfsDocumentHash }] : []),
    ],
  };
}