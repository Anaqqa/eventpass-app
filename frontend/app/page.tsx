import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border p-8">
        <h1 className="text-3xl font-bold">🎫 EventPass</h1>
        <p className="mt-2 text-gray-600">
          Billetterie blockchain : achat, revente contrôlée et validation de billets NFT.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link className="rounded-xl border p-4 hover:bg-gray-50" href="/buy">
            <div className="font-semibold">Acheter un billet</div>
            <div className="text-sm text-gray-600">Mint un NFT Ticket</div>
          </Link>

          <Link className="rounded-xl border p-4 hover:bg-gray-50" href="/my-tickets">
            <div className="font-semibold">Mes billets</div>
            <div className="text-sm text-gray-600">Voir les tickets détenus</div>
          </Link>

          <Link className="rounded-xl border p-4 hover:bg-gray-50" href="/resell">
            <div className="font-semibold">Revendre</div>
            <div className="text-sm text-gray-600">Lister / acheter en revente</div>
          </Link>

          <Link className="rounded-xl border p-4 hover:bg-gray-50" href="/validate">
            <div className="font-semibold">Valider</div>
            <div className="text-sm text-gray-600">Scanner / vérifier / burn</div>
          </Link>
        </div>
      </div>
    </main>
  );
}