"use client";

import { useMemo, useState } from "react";
import { buyTicket } from "../../src/lib/contract";
import { TicketType, TICKET_NAMES, TICKET_PRICES_ETH } from "../../src/lib/contractABI";
import { buildTicketMeta, toDataTokenURI } from "../../src/lib/metadata";

function tierToString(tier: TicketType) {
  return tier === TicketType.EARLY_BIRD
    ? "EARLY_BIRD"
    : tier === TicketType.STANDARD
    ? "STANDARD"
    : tier === TicketType.PREMIUM
    ? "PREMIUM"
    : "VIP";
}

export default function BuyPage() {
  const [tier, setTier] = useState<TicketType>(TicketType.STANDARD);
  const [seat, setSeat] = useState("A-45");
  const [loading, setLoading] = useState(false);
  const [tokenURI, setTokenURI] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const tierName = useMemo(() => TICKET_NAMES[tier], [tier]);
  const ethPrice = useMemo(() => TICKET_PRICES_ETH[tier], [tier]);

  const onBuy = async () => {
    setLoading(true);
    setErr(null);
    setTxHash(null);
    setTokenURI(null);

    try {
      // Construire la metadata (fonction EXISTANTE)
      const meta = buildTicketMeta({
        tier: tierToString(tier),
        seat,
      });

      // Convertir en data:tokenURI (zéro IPFS, zéro gateway)
      const uri = toDataTokenURI(meta);
      setTokenURI(uri);

      // Achat on-chain
      const tx = await buyTicket(tier, uri, ethPrice);
      setTxHash(tx.hash);
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Erreur achat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">← Retour</a>

        <h1 className="mt-4 text-2xl font-bold">Acheter un billet</h1>

        <div className="mt-6 rounded-xl border p-4">
          <select
            value={tier}
            onChange={(e) => setTier(Number(e.target.value) as TicketType)}
            className="w-full rounded-lg border p-2"
          >
            <option value={TicketType.EARLY_BIRD}>{TICKET_NAMES[0]}</option>
            <option value={TicketType.STANDARD}>{TICKET_NAMES[1]}</option>
            <option value={TicketType.PREMIUM}>{TICKET_NAMES[2]}</option>
            <option value={TicketType.VIP}>{TICKET_NAMES[3]}</option>
          </select>

          <input
            className="mt-3 w-full rounded-lg border p-2"
            value={seat}
            onChange={(e) => setSeat(e.target.value)}
            placeholder="Seat (ex: A-45)"
          />

          <button
            onClick={onBuy}
            disabled={loading}
            className="mt-4 w-full rounded-lg border px-3 py-2"
          >
            {loading ? "Achat..." : `Acheter ${tierName} (${ethPrice} ETH)`}
          </button>
        </div>

        {tokenURI && (
          <div className="mt-4 text-xs break-all bg-gray-50 p-3 rounded">
            tokenURI : {tokenURI.slice(0, 80)}...
          </div>
        )}

        {txHash && (
          <div className="mt-3 bg-green-50 p-3 text-sm rounded">
             Achat confirmé<br />
            <span className="font-mono break-all">{txHash}</span>
          </div>
        )}

        {err && (
          <div className="mt-3 bg-red-50 p-3 text-sm text-red-700 rounded">
            {err}
          </div>
        )}
      </div>
    </main>
  );
}