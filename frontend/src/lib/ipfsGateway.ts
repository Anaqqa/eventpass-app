// frontend/src/lib/ipfsGateway.ts

const DEFAULT_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export function ipfsToHttp(uri?: string) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return uri;
}