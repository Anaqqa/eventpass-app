import { NextResponse } from "next/server";

/**
 * POST /api/ipfs/image
 * 
 * Reçoit un fichier image via FormData (champ "file"),
 * l'upload sur Pinata via pinFileToIPFS,
 * retourne { ipfsHash, uri: "ipfs://..." }
 * 
 * Nécessite PINATA_JWT dans .env.local
 */
export async function POST(req: Request) {
  try {
    const jwt = process.env.PINATA_JWT;

    if (!jwt) {
      return NextResponse.json(
        { error: "PINATA_JWT manquant dans .env.local" },
        { status: 500 }
      );
    }

    // Récupérer le fichier depuis le FormData envoyé par le client
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier reçu. Envoyer un champ 'file' via FormData." },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien une image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image (image/png, image/jpeg, image/webp...)" },
        { status: 400 }
      );
    }

    // Limiter la taille à 10 Mo
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop grand. Maximum 10 Mo." },
        { status: 400 }
      );
    }

    // Construire le FormData pour l'API Pinata
    const pinataForm = new FormData();
    pinataForm.append("file", file, file.name);

    // Options optionnelles : nom du fichier sur Pinata
    const pinataOptions = JSON.stringify({
      pinataFilename: file.name,
    });
    pinataForm.append("pinataOptions", pinataOptions);

    // Appel à l'API Pinata pinFileToIPFS
    const pinataRes = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          // Pas de Content-Type ici : le navigateur le génère automatiquement avec le boundary
        },
        body: pinataForm,
      }
    );

    const data = await pinataRes.json();

    if (!pinataRes.ok) {
      return NextResponse.json(
        { error: "Erreur Pinata lors de l'upload", details: data },
        { status: 500 }
      );
    }

    // Retourner le hash IPFS et l'URI
    return NextResponse.json({
      ipfsHash: data.IpfsHash,
      uri: `ipfs://${data.IpfsHash}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erreur serveur lors de l'upload image" },
      { status: 500 }
    );
  }
}