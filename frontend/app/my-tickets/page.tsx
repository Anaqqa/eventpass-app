type Ticket = {
  id: number;
  type: "EARLY_BIRD" | "STANDARD" | "PREMIUM" | "VIP";
  seat: string;
  status: "ACTIVE" | "LISTED" | "USED";
};

const mockTickets: Ticket[] = [
  { id: 1, type: "VIP", seat: "A-45", status: "ACTIVE" },
  { id: 2, type: "STANDARD", seat: "C-12", status: "LISTED" },
];

export default function MyTicketsPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">← Retour</a>

        <h1 className="mt-4 text-2xl font-bold">Mes billets</h1>
        <p className="mt-2 text-gray-600">
          Liste des tickets détenus par le wallet. (Données mock pour l’instant.)
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3">
          {mockTickets.map((t) => (
            <div key={t.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  #{t.id} — {t.type.replace("_", " ")}
                </div>
                <span className="rounded-full border px-3 py-1 text-xs">
                  {t.status}
                </span>
              </div>

              <div className="mt-2 text-sm text-gray-700">
                Siège : <span className="font-medium">{t.seat}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <a
                  href="/resell"
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Revendre
                </a>
                <a
                  href="/validate"
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Valider
                </a>
              </div>
            </div>
          ))}

          {mockTickets.length === 0 && (
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              Aucun billet trouvé.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
