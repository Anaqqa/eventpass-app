export async function uploadJSONToIPFS(data: any): Promise<string> {
  const res = await fetch("/api/ipfs/json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const out = await res.json();

  if (!res.ok) {
    throw new Error(out?.error ?? "Upload IPFS failed");
  }

  return out.uri as string; // ex: ipfs://Qm...
}
