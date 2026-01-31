"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyTokenIds, getTokenURI } from "../../src/lib/contract";
import { ipfsToHttp } from "../../src/lib/ipfsGateway";
import { QRCodeCanvas } from "qrcode.react";

type TicketMeta = {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: any }>;
};

type MyTicket = {
  tokenId: number;
  tokenURI: string;
  meta?: TicketMeta;
  metaError?: string;
};

function getAttr(meta: TicketMeta | undefined, key: string) {
  const k = key.toLowerCase();
  return meta?.attributes?.find((a) => (a.trait_type || "").toLowerCase() === k)?.value;
}

function extractTier(meta?: TicketMeta) {
  const v = getAttr(meta, "tier") ?? getAttr(meta, "type");
  const s = String(v ?? "").toUpperCase();
  return ["EARLY_BIRD", "STANDARD", "PREMIUM", "VIP"].includes(s) ? s : "TICKET";
}

function extractSeat(meta?: TicketMeta) {
  const v = getAttr(meta, "seat") ?? getAttr(meta, "seatnumber") ?? getAttr(meta, "seatNumber");
  return v ? String(v) : "—";
}

function parseDataTokenURI(tokenURI: string): TicketMeta | null {
  const prefix = "data:application/json;base64,";
  if (!tokenURI?.startsWith(prefix)) return null;

  try {
    const b64 = tokenURI.slice(prefix.length);
    const json = decodeURIComponent(escape(window.atob(b64)));
    return JSON.parse(json) as TicketMeta;
  } catch {
    return null;
  }
}

export default function MyTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);

    try {
      const tokenIds = await getMyTokenIds();

      const rows = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tokenURI = await getTokenURI(tokenId);

          let meta: TicketMeta | undefined;
          let metaError: string | undefined;

          const metaFromData = parseDataTokenURI(tokenURI);
          if (metaFromData) {
            meta = metaFromData;
          } else {
            try {
              const url = ipfsToHttp(tokenURI);
              const res = await fetch(url, { cache: "no-store" });
              if (res.ok) meta = await res.json();
              else metaError = `Metadata HTTP ${res.status}`;
            } catch (e: any) {
              metaError = e?.message || "Failed to fetch metadata";
            }
          }

          return { tokenId, tokenURI, meta, metaError };
        })
      );

      setTickets(rows);
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Erreur chargement mes billets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">
          ← Retour
        </a>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mes billets</h1>
            <p className="mt-2 text-gray-600">
              Liste on-chain via tes events (Purchased/Resold/Validated).
            </p>
          </div>

          <button
            onClick={load}
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

        {!loading && !err && tickets.length === 0 && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            Aucun billet trouvé.
          </div>
        )}

        <div className="mt-6 grid gap-3">
          {tickets.map((t) => {
            const tier = extractTier(t.meta).replace("_", " ");
            const seat = extractSeat(t.meta);

            const imageUrl = t.meta?.image ? ipfsToHttp(t.meta.image) : null;

            // Valeur du QR : URL directe de validation
            // (fonctionne en démo : tu scans -> ça ouvre /validate?tokenId=...)
            const qrValue =
              typeof window !== "undefined"
                ? `${window.location.origin}/validate?tokenId=${t.tokenId}`
                : `/validate?tokenId=${t.tokenId}`;

            return (
              <div key={t.tokenId} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    #{t.tokenId} — {tier}
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs">ACTIVE</span>
                </div>

                <div className="mt-3 flex items-start gap-4">
                  {/* Image */}
                  <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  {/* Infos */}
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">
                      Siège : <span className="font-medium">{seat}</span>
                    </div>

                    {t.metaError && !t.meta && (
                      <div className="mt-2 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-800">
                        Metadata non chargée : {t.metaError}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-mono break-all">{t.tokenURI}</span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => router.push(`/resell?tokenId=${t.tokenId}`)}
                        className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Revendre
                      </button>
                      <button
                        onClick={() => router.push(`/validate?tokenId=${t.tokenId}`)}
                        className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Valider
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-lg border bg-white p-2">
                      <QRCodeCanvas value={qrValue} size={92} />
                    </div>
                    <div className="text-[11px] text-gray-600">Scan → Valider</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          Après un <b>burn</b> : reviens ici et clique <b>Rafraîchir</b> → le billet doit disparaître.
        </div>
      </div>
    </main>
  );
}