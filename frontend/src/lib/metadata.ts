export type TicketType = "EARLY_BIRD" | "STANDARD" | "PREMIUM" | "VIP";

export function buildTicketMetadata(params: {
  eventName: string;
  type: TicketType;
  valueEur: number;
  ipfsDocumentHash: string; // hash IPFS du doc (image/qr/pdf)
  seatNumber: string;
  venue: string;
  dateISO: string;
  previousOwners?: string[];
}) {
  const now = Math.floor(Date.now() / 1000);

  return {
    name: `${params.eventName} - ${params.type} ${params.seatNumber}`,
    type: params.type,
    value: `${params.valueEur} EUR`,
    hash: params.ipfsDocumentHash,
    previousOwners: params.previousOwners ?? [],
    createdAt: String(now),
    lastTransferAt: String(now),
    eventDetails: {
      venue: params.venue,
      date: params.dateISO,
      seatNumber: params.seatNumber,
    },
  };
}
