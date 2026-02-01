// frontend/src/lib/ipfs.ts

export async function uploadJSONToIPFS(json: any): Promise<string> {
  const res = await fetch("/api/ipfs/json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`IPFS upload failed (${res.status}) ${txt}`);
  }

  const data = await res.json();
  if (!data?.uri) throw new Error("IPFS upload: missing uri in response");

  return data.uri as string; // ipfs://CID
}