export type TicketMeta = {
  name: string;
  description?: string;
  image?: string; // optionnel
  attributes?: Array<{ trait_type: string; value: any }>;
};

export function buildTicketMeta(params: { tier: string; seat: string }): TicketMeta {
  const { tier, seat } = params;

  return {
    name: `EventPass — ${tier.replace("_", " ")}`,
    description: "Billet NFT EventPass (demo).",
    // image: tu peux laisser vide pour l’instant, ou mettre une URL http
    attributes: [
      { trait_type: "tier", value: tier },
      { trait_type: "seat", value: seat },
    ],
  };
}

/**
 * Convertit un objet JSON en tokenURI data:application/json;base64,...
 * => 0 dépendance aux gateways IPFS
 */
export function toDataTokenURI(meta: any): string {
  const json = JSON.stringify(meta);
  // btoa en navigateur; Buffer en node. On supporte les 2.
  const base64 =
    typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64");

  return `data:application/json;base64,${base64}`;
}

/**
 * Décode un tokenURI data:application/json;base64,...
 */
export function parseDataTokenURI(tokenURI: string): TicketMeta | null {
  const prefix = "data:application/json;base64,";
  if (!tokenURI?.startsWith(prefix)) return null;

  try {
    const b64 = tokenURI.slice(prefix.length);
    const json =
      typeof window !== "undefined"
        ? decodeURIComponent(escape(window.atob(b64)))
        : Buffer.from(b64, "base64").toString("utf8");

    return JSON.parse(json);
  } catch {
    return null;
  }
}