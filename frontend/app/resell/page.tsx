type Listing = {
  listingId: number;
  tokenId: number;
  type: "EARLY_BIRD" | "STANDARD" | "PREMIUM" | "VIP";
  priceEur: number;
  seller: string;
};

const mockListings: Listing[] = [
  { listingId: 1, tokenId: 7, type: "STANDARD", priceEur: 110, seller: "0xAbc...123" },
  { listingId: 2, tokenId: 12, type: "VIP", priceEur: 300, seller: "0xDef...456" },
];

export default function ResellPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">← Retour</a>

        <h1 className="mt-4 text-2xl font-bold">Revente</h1>
        <p className="mt-2 text-gray-600">
          Marketplace de revente contrôlée (+20% max, 1 revente max). (Mock pour l’instant.)
        </p>

        {/* List a ticket */}
        <div className="mt-6 rounded-xl border p-4">
          <div className="font-semibold">Lister un billet</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="rounded-lg border p-2"
              placeholder="Token ID (ex: 12)"
            />
            <input
              className="rounded-lg border p-2"
              placeholder="Prix EUR (max +20%)"
            />
            <button className="rounded-lg border p-2 hover:bg-gray-50">
              Lister
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Prochaine étape : appeler <code>listForResale(tokenId, price)</code>.
          </div>
        </div>

        {/* Listings */}
        <h2 className="mt-8 text-lg font-semibold">Offres disponibles</h2>

        <div className="mt-3 grid grid-cols-1 gap-3">
          {mockListings.map((l) => (
            <div key={l.listingId} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  Ticket #{l.tokenId} — {l.type.replace("_", " ")}
                </div>
                <div className="text-sm font-medium">{l.priceEur} EUR</div>
              </div>

              <div className="mt-2 text-sm text-gray-700">
                Vendeur : <span className="font-mono">{l.seller}</span>
              </div>

              <div className="mt-4">
                <button className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
                  Acheter
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-600">
                Prochaine étape : appeler <code>buyResale(listingId)</code>.
              </div>
            </div>
          ))}

          {mockListings.length === 0 && (
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              Aucune offre pour le moment.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
