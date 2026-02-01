"use client";

import { useMemo, useRef, useState } from "react";
import { buyTicket } from "../../src/lib/contract";
import { TicketType, TICKET_NAMES, TICKET_PRICES_ETH } from "../../src/lib/contractABI";
import { buildTicketMeta, toDataTokenURI } from "../../src/lib/metadata";

function tierToString(tier: TicketType) {
  return tier === TicketType.EARLY_BIRD
    ? "EARLY_BIRD"
    : tier === TicketType.STANDARD
    ? "STANDARD"
    : tier === TicketType.PREMIUM
    ? "PREMIUM"
    : "VIP";
}

/**
 * Upload une image sur IPFS via notre route API /api/ipfs/image
 * Retourne l'URI ipfs://... ou null si aucune image choisie
 */
async function uploadImageToIPFS(file: File | null): Promise<string | null> {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/ipfs/image", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload image échoué (${res.status}) ${txt}`);
  }

  const data = await res.json();
  if (!data?.uri) throw new Error("Upload image : pas d'URI retourné");

  return data.uri as string; // ipfs://CID
}

export default function BuyPage() {
  const [tier, setTier] = useState<TicketType>(TicketType.STANDARD);
  const [seat, setSeat] = useState("A-45");
  const [loading, setLoading] = useState(false);
  const [tokenURI, setTokenURI] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // État pour l'image du billet
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tierName = useMemo(() => TICKET_NAMES[tier], [tier]);
  const ethPrice = useMemo(() => TICKET_PRICES_ETH[tier], [tier]);

  // Gérer la sélection d'une image
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setUploadStatus(null);

    if (file) {
      // Générer une preview locale avec FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Supprimer l'image sélectionnée
  const onRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onBuy = async () => {
    setLoading(true);
    setErr(null);
    setTxHash(null);
    setTokenURI(null);
    setUploadStatus(null);

    try {
      // 1. Si une image a été choisie, l'uploader sur IPFS d'abord
      let imageUri: string | null = null;
      if (imageFile) {
        setUploadStatus("Upload image sur IPFS...");
        imageUri = await uploadImageToIPFS(imageFile);
        setUploadStatus("✅ Image uploadée sur IPFS");
      }

      // 2. Construire les métadonnées du billet
      const meta = buildTicketMeta({
        tier: tierToString(tier),
        seat,
      });

      // 3. Ajouter l'image URI dans les métadonnées si elle existe
      if (imageUri) {
        meta.image = imageUri;
      }

      // 4. Convertir en tokenURI (data:base64 pour le démo local)
      const uri = toDataTokenURI(meta);
      setTokenURI(uri);

      // 5. Achat on-chain
      setUploadStatus("Transaction en cours...");
      const tx = await buyTicket(tier, uri, ethPrice);
      setTxHash(tx.hash);
      setUploadStatus(null);
    } catch (e: any) {
      setErr(e?.shortMessage || e?.message || "Erreur achat");
      setUploadStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border p-8">
        <a href="/" className="text-sm underline">← Retour</a>

        <h1 className="mt-4 text-2xl font-bold">Acheter un billet</h1>

        <div className="mt-6 rounded-xl border p-4">
          {/* Sélection du type de billet */}
          <select
            value={tier}
            onChange={(e) => setTier(Number(e.target.value) as TicketType)}
            className="w-full rounded-lg border p-2"
          >
            <option value={TicketType.EARLY_BIRD}>{TICKET_NAMES[0]}</option>
            <option value={TicketType.STANDARD}>{TICKET_NAMES[1]}</option>
            <option value={TicketType.PREMIUM}>{TICKET_NAMES[2]}</option>
            <option value={TicketType.VIP}>{TICKET_NAMES[3]}</option>
          </select>

          {/* Numéro de siège */}
          <input
            className="mt-3 w-full rounded-lg border p-2"
            value={seat}
            onChange={(e) => setSeat(e.target.value)}
            placeholder="Siège (ex: A-45)"
          />

          {/* Upload image du billet — BONUS IPFS */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image du billet <span className="text-gray-400 font-normal">(optionnel — stockée sur IPFS)</span>
            </label>

            {!imagePreview ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                  id="ticket-image-input"
                />
                <label
                  htmlFor="ticket-image-input"
                  className="cursor-pointer text-sm text-blue-600 hover:underline"
                >
                  Choisir une image
                </label>
                <p className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP — max 10 Mo</p>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                {/* Preview de l'image */}
                <div className="h-24 w-24 overflow-hidden rounded-lg border bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Info fichier + bouton supprimer */}
                <div className="flex-1">
                  <div className="text-sm text-gray-700 truncate">
                    {imageFile?.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {imageFile ? (imageFile.size / 1024).toFixed(1) : "0"} Ko
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Statut upload / transaction */}
          {uploadStatus && (
            <div className="mt-3 rounded-lg bg-blue-50 p-2 text-sm text-blue-700">
              {uploadStatus}
            </div>
          )}

          {/* Bouton achat */}
          <button
            onClick={onBuy}
            disabled={loading}
            className="mt-4 w-full rounded-lg border px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "En cours..." : `Acheter — ${ethPrice} ETH`}
          </button>
        </div>

        {/* Erreur */}
        {err && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Succès */}
        {txHash && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            <div className="font-semibold">✅ Billet acheté !</div>
            <div className="mt-1 text-xs font-mono break-all">Tx : {txHash}</div>
            <a href="/my-tickets" className="mt-2 inline-block text-sm underline">
              Voir mes billets →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}