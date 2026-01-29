export default function BuyPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">← Retour</a>

        <h1 className="mt-4 text-2xl font-bold">Acheter un billet</h1>
        <p className="mt-2 text-gray-600">
          Sélectionne un type de billet. (La connexion wallet et l’achat on-chain viendront ensuite.)
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button className="rounded-xl border p-4 text-left hover:bg-gray-50">
            <div className="font-semibold">🌟 EARLY BIRD</div>
            <div className="text-sm text-gray-600">80 EUR</div>
          </button>

          <button className="rounded-xl border p-4 text-left hover:bg-gray-50">
            <div className="font-semibold">🎫 STANDARD</div>
            <div className="text-sm text-gray-600">100 EUR</div>
          </button>

          <button className="rounded-xl border p-4 text-left hover:bg-gray-50">
            <div className="font-semibold">💎 PREMIUM</div>
            <div className="text-sm text-gray-600">150 EUR</div>
          </button>

          <button className="rounded-xl border p-4 text-left hover:bg-gray-50">
            <div className="font-semibold">VIP</div>
            <div className="text-sm text-gray-600">250 EUR</div>
          </button>
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          Prochaine étape : connecter MetaMask et appeler <code>buyTicket()</code> du smart contract.
        </div>
      </div>
    </main>
  );
}
