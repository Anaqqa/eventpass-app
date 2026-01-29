export default function ValidatePage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">← Retour</a>

        <h1 className="mt-4 text-2xl font-bold">Validation</h1>
        <p className="mt-2 text-gray-600">
          Valider un billet à l’entrée (vérification on-chain) puis burn du NFT. (Mock pour l’instant.)
        </p>

        <div className="mt-6 rounded-xl border p-4">
          <div className="font-semibold">Valider un billet</div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="rounded-lg border p-2 sm:col-span-2"
              placeholder="Token ID (ex: 12)"
            />
            <button className="rounded-lg border p-2 hover:bg-gray-50">
              Valider & Burn
            </button>
          </div>

          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            Prochaine étape : appeler <code>validateAndBurn(tokenId)</code> (réservé au valideur/organisateur).
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-700">
          <div className="font-semibold">Plus tard :</div>
          <ul className="mt-2 list-disc pl-5 text-gray-600">
            <li>Scanner un QR Code (qui contient le Token ID ou un lien IPFS)</li>
            <li>Vérifier ownership + statut (non utilisé) sur la blockchain</li>
            <li>Burn du NFT après validation</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
