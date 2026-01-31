"use client";

import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contractABI";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  if (!CONTRACT_ADDRESS) {
    throw new Error("Missing NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return { contract, provider, signer };
}

export async function buyTicket(ticketType: number, tokenURI: string, ethPrice: string) {
  const { contract } = await getContract();
  const tx = await contract.buyTicket(ticketType, tokenURI, {
    value: ethers.parseEther(ethPrice),
  });
  await tx.wait();
  return tx;
}

export async function listForResale(tokenId: number, priceInEth: string) {
  const { contract } = await getContract();
  const tx = await contract.listForResale(tokenId, ethers.parseEther(priceInEth));
  await tx.wait();
  return tx;
}

export async function buyResale(listingId: number, ethPrice: string) {
  const { contract } = await getContract();
  const tx = await contract.buyResale(listingId, {
    value: ethers.parseEther(ethPrice),
  });
  await tx.wait();
  return tx;
}

export async function validateAndBurn(tokenId: number) {
  const { contract } = await getContract();
  const tx = await contract.validateAndBurn(tokenId);
  await tx.wait();
  return tx;
}

// --- AJOUTS POUR "MY TICKETS" ---
export async function getMyAddress() {
  const { signer } = await getContract();
  return await signer.getAddress();
}

export async function getMyTokenIds(): Promise<number[]> {
  const { provider, signer } = await getContract();

  if (!CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS");

  const owner = (await signer.getAddress()).toLowerCase();

  // Signature ERC721 standard
  const TRANSFER_TOPIC0 = ethers.id("Transfer(address,address,uint256)");

  // topics[1] et topics[2] = addresses indexées (32 bytes)
  const ownerTopic = ethers.zeroPadValue(owner, 32);

  // Logs: Transfer(* -> owner)
  const toLogs = await provider.getLogs({
    address: CONTRACT_ADDRESS,
    fromBlock: 0,
    toBlock: "latest",
    topics: [TRANSFER_TOPIC0, null, ownerTopic],
  });

  // Logs: Transfer(owner -> *)
  const fromLogs = await provider.getLogs({
    address: CONTRACT_ADDRESS,
    fromBlock: 0,
    toBlock: "latest",
    topics: [TRANSFER_TOPIC0, ownerTopic],
  });

  // On parse avec une interface minimale (pas besoin de ton ABI complet)
  const iface = new ethers.Interface([
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  ]);

  const owned = new Set<number>();

  for (const log of toLogs) {
    const parsed = iface.parseLog(log);
    const tokenId = Number(parsed.args.tokenId);
    owned.add(tokenId);
  }

  for (const log of fromLogs) {
    const parsed = iface.parseLog(log);
    const tokenId = Number(parsed.args.tokenId);
    owned.delete(tokenId);
  }

  return Array.from(owned).sort((a, b) => a - b);
}


export async function getTokenURI(tokenId: number): Promise<string> {
  const { contract } = await getContract();
  return await contract.tokenURI(tokenId);
}
