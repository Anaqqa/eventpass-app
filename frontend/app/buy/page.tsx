"use client";

import { useState } from "react";
import { buildTicketMetadata } from "../../src/lib/metadata";
import { uploadJSONToIPFS } from "../../src/lib/ipfs";

export default function BuyPage() {
  const [ipfsUri, setIpfsUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const testIPFS = async () => {
    setLoading(true);
    setErr(null);
    setIpfsUri(null);

    try {
      const metadata = buildTicketMetadata({
        eventName: "Concert Demo",
        type: "VIP",
        valueEur: 250,
        ipfsDocumentHash: "QmDemoDocHash123",
        seatNumber: "A-45",
        venue: "Stade de France",
        dateISO: "2026-06-15T20:00:00Z",
        previousOwners: [],
      });

      const uri = await uploadJSONToIPFS(metadata);
      setIpfsUri(uri);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur upload IPFS");
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
          On prépare le flux : générer metadata → upload IPFS → obtenir tokenURI → (plus tard) buyTicket().
        </p>

        <div className="mt-6 rounded-xl border p-4">
          <div className="font-semibold">Test IPFS (Pinata)</div>
          <p className="mt-1 text-sm text-gray-600">
            Clique pour uploader un JSON metadata et recevoir un vrai URI IPFS.
          </p>

          <button
            onClick={testIPFS}
            disabled={loading}
            className="mt-3 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Upload en cours..." : "Tester l’upload IPFS"}
          </button>

          {ipfsUri && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              URI : <span className="font-mono">{ipfsUri}</span>
            </div>
          )}

          {err && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
               {err}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          Prochaine étape : quand le smart contract est prêt, on enverra ce URI à <code>buyTicket(type, tokenURI)</code>.
        </div>
      </div>
    </main>
  );
}
