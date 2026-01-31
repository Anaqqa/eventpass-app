"use client";

import { useState } from "react";
import { buildTicketMetadata } from "../../src/lib/metadata";
import { uploadJSONToIPFS } from "../../src/lib/ipfs";
import { buyTicket as buyTicketOnChain } from "../../src/lib/contract"; 

type TicketType = "EARLY_BIRD" | "STANDARD" | "PREMIUM" | "VIP";

// mapping type -> index (doit matcher ton smart contract)
const TYPE_INDEX: Record<TicketType, number> = {
  EARLY_BIRD: 0,
  STANDARD: 1,
  PREMIUM: 2,
  VIP: 3,
};

// mapping type -> prix (doit matcher ton contrat)
const PRICE_ETH: Record<TicketType, string> = {
  EARLY_BIRD: "0.08",
  STANDARD: "0.10",
  PREMIUM: "0.15",
  VIP: "0.25",
};

export default function BuyPage() {
  const [selectedType, setSelectedType] = useState<TicketType>("EARLY_BIRD");

  const [ipfsUri, setIpfsUri] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [loadingIpfs, setLoadingIpfs] = useState(false);
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const generateIpfs = async () => {
    setLoadingIpfs(true);
    setErr(null);
    setIpfsUri(null);
    setTxHash(null);

    try {
      const metadata = buildTicketMetadata({
        eventName: "Concert Demo",
        type: selectedType,
        valueEur:
          selectedType === "EARLY_BIRD"
            ? 80
            : selectedType === "STANDARD"
            ? 100
            : selectedType === "PREMIUM"
            ? 150
            : 250,
        ipfsDocumentHash: "QmDemoDocHash123",
        seatNumber: "A-45",
        venue: "Stade de France",
        dateISO: "2026-06-15T20:00:00Z",
        previousOwners: [],
      });

      const uri = await uploadJSONToIPFS(metadata);
      setIpfsUri(uri);
      return uri;
    } catch (e: any) {
      setErr(e?.message ?? "Erreur upload IPFS");
      return null;
    } finally {
      setLoadingIpfs(false);
    }
  };

  const handleBuy = async () => {
    setLoadingBuy(true);
    setErr(null);
    setTxHash(null);

    try {
      // 1) Assure-toi d'avoir un tokenURI IPFS
      const uri = ipfsUri ?? (await generateIpfs());
      if (!uri) throw new Error("Impossible de générer l'URI IPFS");

      // 2) Appel smart contract via ton helper
      const typeIndex = TYPE_INDEX[selectedType];
      const priceEth = PRICE_ETH[selectedType];

      const tx = await buyTicketOnChain(typeIndex, uri, priceEth);
      setTxHash(tx.hash);
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Erreur achat");
    } finally {
      setLoadingBuy(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">
          ← Retour
        </a>

        <h1 className="mt-4 text-2xl font-bold">Acheter un billet</h1>
        <p className="mt-2 text-gray-600">
          Flux : metadata → IPFS → tokenURI → buyTicket(type, tokenURI).
        </p>

        {/* Choix type */}
        <div className="mt-6 rounded-xl border p-4">
          <div className="font-semibold">Choisir un type</div>
          <div className="mt-3 grid gap-2">
            {(Object.keys(TYPE_INDEX) as TicketType[]).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`rounded-lg border px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  selectedType === t ? "bg-gray-50" : ""
                }`}
              >
                <div className="font-medium">
                  {t} — {PRICE_ETH[t]} ETH
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* IPFS */}
        <div className="mt-6 rounded-xl border p-4">
          <div className="font-semibold">Étape 1 — Tester l’upload IPFS</div>
          <button
            onClick={generateIpfs}
            disabled={loadingIpfs}
            className="mt-3 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {loadingIpfs ? "Upload en cours..." : "Tester l’upload IPFS"}
          </button>

          {ipfsUri && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              URI : <span className="font-mono">{ipfsUri}</span>
            </div>
          )}
        </div>

        {/* Achat */}
        <div className="mt-6 rounded-xl border p-4">
          <div className="font-semibold">Étape 2 — Acheter maintenant</div>
          <button
            onClick={handleBuy}
            disabled={loadingBuy}
            className="mt-3 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {loadingBuy ? "Transaction..." : `Acheter (${PRICE_ETH[selectedType]} ETH)`}
          </button>

          {txHash && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              Tx Hash : <span className="font-mono">{txHash}</span>
            </div>
          )}
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}
      </div>
    </main>
  );
}
