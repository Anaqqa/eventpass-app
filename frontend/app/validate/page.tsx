"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { validateAndBurn } from "../../src/lib/contract";

export default function ValidatePage() {
  const searchParams = useSearchParams();
  const preset = searchParams.get("tokenId") ?? "";

  const [tokenId, setTokenId] = useState(preset);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const can = useMemo(() => {
    const n = Number(tokenId);
    return Number.isFinite(n) && n > 0;
  }, [tokenId]);

  const onValidate = async () => {
    setLoading(true);
    setErr(null);
    setOk(null);

    try {
      const tx = await validateAndBurn(Number(tokenId));
      setOk(tx.hash);
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Erreur validation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">← Retour</a>

        <h1 className="mt-4 text-2xl font-bold">Validation</h1>
        <p className="mt-2 text-gray-600">
          Valider un billet (on-chain) puis burn. Après ça, le ticket doit disparaître de “Mes billets”.
        </p>

        <div className="mt-6 rounded-xl border p-4">
          <div className="font-semibold">Valider un billet</div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="rounded-lg border p-2 sm:col-span-2"
              placeholder="Token ID (ex: 1)"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
            <button
              onClick={onValidate}
              disabled={!can || loading}
              className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Validation..." : "Valider & Burn"}
            </button>
          </div>

          {ok && (
            <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              ✅ Validé — Tx : <span className="font-mono break-all">{ok}</span>
              <div className="mt-2 text-xs">
                Va sur <b>Mes billets</b> puis <b>Rafraîchir</b>.
              </div>
            </div>
          )}

          {err && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}