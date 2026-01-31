"use client";

import { useState } from "react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setError(null);

    if (!window.ethereum) {
      setError("MetaMask n’est pas détecté. Installe-le pour continuer.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts?.[0] ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Connexion refusée.");
    }
  };

  return (
    <div className="mt-6 rounded-xl border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold">Wallet</div>
          <div className="text-sm text-gray-600">
            {address ? (
              <>
                Connecté : <span className="font-mono">{address}</span>
              </>
            ) : (
              "Non connecté"
            )}
          </div>
        </div>

        <button
          onClick={connect}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          {address ? "Reconnecter" : "Connect Wallet"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
