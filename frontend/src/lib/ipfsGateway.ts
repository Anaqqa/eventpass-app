// frontend/src/lib/ipfsGateway.ts

const DEFAULT_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export function ipfsToHttp(uri: string): string {
  if (!uri) return uri;

  const gw = process.env.NEXT_PUBLIC_IPFS_GATEWAY || DEFAULT_GATEWAY;

  // ipfs://CID
  if (uri.startsWith("ipfs://")) {
    const clean = uri.replace("ipfs://", "").replace(/^ipfs\//, "");
    return gw.endsWith("/") ? `${gw}${clean}` : `${gw}/${clean}`;
  }

  // déjà http
  return uri;
}