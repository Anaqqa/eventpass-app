"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { validateAndBurn } from "../../src/lib/contract";

function humanizeError(msg: string) {
  const m = (msg || "").toLowerCase();

  if (m.includes("not ticket owner")) return "Ce wallet ne possède pas ce billet.";
  if (m.includes("invalid token id") || m.includes("nonexistent token") || m.includes("owner query for nonexistent token"))
    return "Billet déjà utilisé (burn) ou inexistant.";
  if (m.includes("user rejected") || m.includes("user denied") || m.includes("rejected"))
    return "Transaction refusée dans MetaMask.";
  if (m.includes("insufficient funds")) return "Fonds insuffisants pour payer les frais de gas.";
  if (m.includes("execution reverted")) return "Transaction rejetée par le smart contract.";

  return msg || "Erreur validation";
}

export default function ValidatePage() {
  const searchParams = useSearchParams();
  const preset = searchParams.get("tokenId") ?? "";
  const auto = searchParams.get("auto") === "1"; 

  const [tokenId, setTokenId] = useState(preset);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const alreadyAutoRan = useRef(false);

  const can = useMemo(() => {
    const n = Number(tokenId);
    return Number.isFinite(n) && n > 0;
  }, [tokenId]);

  const onValidate = async () => {
    if (!can) return;

    setLoading(true);
    setErr(null);
    setOk(null);

    try {
      const tx = await validateAndBurn(Number(tokenId));
      setOk(tx.hash);
    } catch (e: any) {
      const raw = e?.shortMessage || e?.message || "Erreur validation";
      setErr(humanizeError(raw));
    } finally {
      setLoading(false);
    }
  };

  // Mode "borne": si URL contient auto=1 et tokenId existe, on valide automatiquement une seule fois
  useEffect(() => {
    if (!auto) return;
    if (!preset) return;
    if (alreadyAutoRan.current) return;

    alreadyAutoRan.current = true;
    // petite pause pour laisser la page se monter + Metamask être prêt
    setTimeout(() => {
      onValidate();
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, preset]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">← Retour</a>

        <h1 className="mt-4 text-2xl font-bold">Validation</h1>
        <p className="mt-2 text-gray-600">
          Scan QR → ouvre cette page avec tokenId. Ensuite validation on-chain + burn.
        </p>

        {auto && (
          <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
            🖥️ Mode borne activé (auto=1). Le billet sera validé automatiquement si tokenId est présent.
          </div>
        )}

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
              Billet validé — Tx : <span className="font-mono break-all">{ok}</span>
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

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          Astuce démo borne : ouvre <b>/validate?tokenId=1&auto=1</b> pour valider automatiquement après scan.
        </div>
      </div>
    </main>
  );
}