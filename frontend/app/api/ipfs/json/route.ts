import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const jwt = process.env.PINATA_JWT;

    console.log("PINATA_JWT length:", jwt?.length);
    console.log("PINATA_JWT preview:", jwt?.slice(0, 12));
 

    if (!jwt) {
      return NextResponse.json(
        { error: "PINATA_JWT manquant dans .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await pinataRes.json();

    if (!pinataRes.ok) {
      return NextResponse.json(
        { error: "Erreur Pinata", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ipfsHash: data.IpfsHash,
      uri: `ipfs://${data.IpfsHash}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}
