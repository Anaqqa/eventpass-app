"use client";

import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contractABI";

declare global {
  interface Window {
    ethereum?: any;
  }
}

function requireAddress() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Missing NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
  }
  return CONTRACT_ADDRESS;
}

function requireEthereum() {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  return window.ethereum;
}

// WRITE (signer)
export async function getContract() {
  const eth = requireEthereum();
  requireAddress();

  const provider = new ethers.BrowserProvider(eth);
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return { contract, provider, signer };
}

// READ (provider only)
export async function getReadOnlyContract() {
  const eth = requireEthereum();
  requireAddress();

  const provider = new ethers.BrowserProvider(eth);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  return { contract, provider };
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

export async function getMyAddress() {
  const { signer } = await getContract();
  return await signer.getAddress();
}

export async function getTokenURI(tokenId: number): Promise<string> {
  const { contract } = await getReadOnlyContract();
  return await contract.tokenURI(tokenId);
}


export async function getMyTokenIds(): Promise<number[]> {
  const { provider } = await getReadOnlyContract();
  const { signer } = await getContract(); // pour connaitre "me"
  const me = ethers.getAddress(await signer.getAddress());

  const TRANSFER_TOPIC0 = ethers.id("Transfer(address,address,uint256)");
  const meTopic = ethers.zeroPadValue(me, 32);

  // Tous les transferts vers moi
  const toLogs = await provider.getLogs({
    address: CONTRACT_ADDRESS,
    fromBlock: 0,
    toBlock: "latest",
    topics: [TRANSFER_TOPIC0, null, meTopic],
  });

  // Tous les transferts depuis moi
  const fromLogs = await provider.getLogs({
    address: CONTRACT_ADDRESS,
    fromBlock: 0,
    toBlock: "latest",
    topics: [TRANSFER_TOPIC0, meTopic],
  });

  const iface = new ethers.Interface([
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  ]);

  const owned = new Set<number>();

  for (const log of toLogs) {
    const parsed = iface.parseLog(log);
    owned.add(Number(parsed.args.tokenId));
  }

  for (const log of fromLogs) {
    const parsed = iface.parseLog(log);
    owned.delete(Number(parsed.args.tokenId));
  }

  return Array.from(owned).sort((a, b) => a - b);
}