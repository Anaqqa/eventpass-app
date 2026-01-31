"use client";

import { useMemo, useState } from "react";
import { buyTicket } from "../../src/lib/contract";
import { buildTicketMetadata } from "../../src/lib/metadata";
import { uploadJSONToIPFS } from "../../src/lib/ipfs";
import { TicketType, TICKET_NAMES, TICKET_PRICES_ETH } from "../../src/lib/contractABI";

export default function BuyPage() {
  const [tier, setTier] = useState<TicketType>(TicketType.STANDARD);
  const [seat, setSeat] = useState("A-45");
  const [loading, setLoading] = useState(false);
  const [ipfsUri, setIpfsUri] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const tierName = useMemo(() => TICKET_NAMES[tier], [tier]);
  const ethPrice = useMemo(() => TICKET_PRICES_ETH[tier], [tier]);

  const onBuy = async () => {
    setLoading(true);
    setErr(null);
    setIpfsUri(null);
    setTxHash(null);

    try {
      const tierStr =
        tier === TicketType.EARLY_BIRD ? "EARLY_BIRD" :
        tier === TicketType.STANDARD ? "STANDARD" :
        tier === TicketType.PREMIUM ? "PREMIUM" : "VIP";

      const metadata = buildTicketMetadata({
        eventName: "Concert Demo",
        tier: tierStr,
        seatNumber: seat,
        venue: "Stade de France",
        dateISO: "2026-06-15T20:00:00Z",
        valueEur: tier === TicketType.VIP ? 250 : tier === TicketType.PREMIUM ? 150 : tier === TicketType.STANDARD ? 100 : 80,
      });

      const uri = await uploadJSONToIPFS(metadata);
      setIpfsUri(uri);

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
        <p className="mt-2 text-gray-600">
          Flux complet : metadata → IPFS → buyTicket() on-chain.
        </p>

        <div className="mt-6 rounded-xl border p-4">
          <div className="font-semibold">Choisir un type</div>

          <select
            value={tier}
            onChange={(e) => setTier(Number(e.target.value) as TicketType)}
            className="mt-3 w-full rounded-lg border p-2"
          >
            <option value={TicketType.EARLY_BIRD}>{TICKET_NAMES[TicketType.EARLY_BIRD]}</option>
            <option value={TicketType.STANDARD}>{TICKET_NAMES[TicketType.STANDARD]}</option>
            <option value={TicketType.PREMIUM}>{TICKET_NAMES[TicketType.PREMIUM]}</option>
            <option value={TicketType.VIP}>{TICKET_NAMES[TicketType.VIP]}</option>
          </select>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border p-2"
              value={seat}
              onChange={(e) => setSeat(e.target.value)}
              placeholder="Seat (ex: A-45)"
            />
            <div className="rounded-lg border p-2 text-sm">
              Prix : <b>{ethPrice} ETH</b>
            </div>
          </div>

          <button
            onClick={onBuy}
            disabled={loading}
            className="mt-4 w-full rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Achat..." : `Acheter ${tierName} (${ethPrice} ETH)`}
          </button>
        </div>

        {ipfsUri && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
            IPFS URI : <span className="font-mono break-all">{ipfsUri}</span>
          </div>
        )}

        {txHash && (
          <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            ✅ Achat confirmé — Tx : <span className="font-mono break-all">{txHash}</span>
            <div className="mt-2 text-xs text-green-700">
              Va dans <b>Mes billets</b> puis clique <b>Rafraîchir</b>.
            </div>
          </div>
        )}

        {err && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}
      </div>
    </main>
  );
}