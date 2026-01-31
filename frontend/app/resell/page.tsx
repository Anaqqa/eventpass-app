"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import { buyResale, getReadOnlyContract, listForResale } from "../../src/lib/contract";

type Listing = {
  listingId: number;
  tokenId: number;
  priceEth: string;
  seller: string;
  active: boolean;
};

export default function ResellPage() {
  const searchParams = useSearchParams();
  const presetTokenId = searchParams.get("tokenId") ?? "";

  const [tokenId, setTokenId] = useState(presetTokenId);
  const [priceEth, setPriceEth] = useState("0.01");

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canList = useMemo(() => {
    const tid = Number(tokenId);
    if (!Number.isFinite(tid) || tid <= 0) return false;
    try {
      return ethers.parseEther(priceEth || "0") > 0n;
    } catch {
      return false;
    }
  }, [tokenId, priceEth]);

  const loadListings = async () => {
    setLoading(true);
    setErr(null);

    try {
      const { contract } = await getReadOnlyContract();

      const MAX_SCAN = 50;
      const rows: Listing[] = [];

      for (let id = 1; id <= MAX_SCAN; id++) {
        try {
          const r = await contract.getListing(id);
          const tok = Number(r[0]);
          const seller = String(r[1]);
          const price = r[2] as bigint;
          const isActive = Boolean(r[3]);

          if (tok > 0) {
            rows.push({
              listingId: id,
              tokenId: tok,
              seller,
              priceEth: ethers.formatEther(price),
              active: isActive,
            });
          }
        } catch {
          // ignore
        }
      }

      setListings(rows.filter((x) => x.active).sort((a, b) => b.listingId - a.listingId));
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Erreur chargement marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onList = async () => {
    setErr(null);
    if (!canList) return;

    setTxLoading("list");
    try {
      await listForResale(Number(tokenId), priceEth);
      setTokenId("");
      await loadListings();
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Erreur listing");
    } finally {
      setTxLoading(null);
    }
  };

  const onBuy = async (l: Listing) => {
    setErr(null);
    setTxLoading(`buy-${l.listingId}`);
    try {
      await buyResale(l.listingId, l.priceEth);
      await loadListings();
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Erreur achat revente");
    } finally {
      setTxLoading(null);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">← Retour</a>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Revente</h1>
            <p className="mt-2 text-gray-600">Lister puis acheter via le smart contract.</p>
          </div>

          <button
            onClick={loadListings}
            disabled={loading}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Chargement..." : "Rafraîchir"}
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mt-6 rounded-xl border p-4">
          <div className="font-semibold">Lister un billet</div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="rounded-lg border p-2"
              placeholder="Token ID (ex: 1)"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
            <input
              className="rounded-lg border p-2"
              placeholder="Prix en ETH (ex: 0.12)"
              value={priceEth}
              onChange={(e) => setPriceEth(e.target.value)}
            />
            <button
              onClick={onList}
              disabled={!canList || txLoading === "list"}
              className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-60"
            >
              {txLoading === "list" ? "Listing..." : "Lister"}
            </button>
          </div>
        </div>

        <h2 className="mt-8 text-lg font-semibold">Offres disponibles</h2>

        {!loading && listings.length === 0 && (
          <div className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            Aucune offre active pour le moment.
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-3">
          {listings.map((l) => (
            <div key={l.listingId} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Listing #{l.listingId} — Ticket #{l.tokenId}</div>
                <div className="text-sm font-medium">{l.priceEth} ETH</div>
              </div>

              <div className="mt-2 text-sm text-gray-700">
                Vendeur : <span className="font-mono break-all">{l.seller}</span>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => onBuy(l)}
                  disabled={txLoading === `buy-${l.listingId}`}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {txLoading === `buy-${l.listingId}` ? "Achat..." : "Acheter"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}