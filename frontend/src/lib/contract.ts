"use client";

// frontend/src/lib/contract.ts

import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contractABI";

declare global {
  interface Window {
    ethereum?: any;
  }
}

function requireEthereum() {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  return window.ethereum;
}

function requireAddress() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Missing NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
  }
  return CONTRACT_ADDRESS;
}

async function assertHardhat(provider: ethers.BrowserProvider) {
  const net = await provider.getNetwork();
  const chainId = Number(net.chainId);
  if (chainId !== 31337) {
    throw new Error(`Wrong network. Expected Hardhat (31337), got ${chainId}.`);
  }
}

/**
 * Write (signer) – force connection
 */
export async function getContract() {
  const eth = requireEthereum();
  requireAddress();

  const provider = new ethers.BrowserProvider(eth);
  await provider.send("eth_requestAccounts", []);
  await assertHardhat(provider);

  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  return { contract, provider, signer };
}

/**
 * Read-only
 */
export async function getReadOnlyContract() {
  const eth = requireEthereum();
  requireAddress();

  const provider = new ethers.BrowserProvider(eth);
  await assertHardhat(provider);

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  return { contract, provider };
}

export async function getMyAddress() {
  const { signer } = await getContract();
  return await signer.getAddress();
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

export async function getTokenURI(tokenId: number): Promise<string> {
  const { contract } = await getReadOnlyContract();
  return await contract.tokenURI(tokenId);
}

/**
 * ✅ MyTickets (robuste)
 * - Ajoute tokenId quand TicketPurchased.buyer == me
 * - Retire quand TicketResold.from == me
 * - Ajoute quand TicketResold.to == me
 * - Retire quand TicketValidated.owner == me
 */
export async function getMyTokenIds(): Promise<number[]> {
  const { contract } = await getReadOnlyContract();
  const { signer } = await getContract();

  const me = ethers.getAddress(await signer.getAddress()).toLowerCase();
  const owned = new Set<number>();

  // 1) Purchased
  const purchased = await contract.queryFilter(contract.filters.TicketPurchased());
  for (const ev of purchased) {
    const args = ev.args;
    if (!args) continue;
    const tokenId = Number(args[0]);
    const buyer = String(args[1]).toLowerCase();
    if (buyer === me) owned.add(tokenId);
  }

  // 2) Resold
  const resold = await contract.queryFilter(contract.filters.TicketResold());
  for (const ev of resold) {
    const args = ev.args;
    if (!args) continue;
    const tokenId = Number(args[0]);
    const from = String(args[1]).toLowerCase();
    const to = String(args[2]).toLowerCase();

    if (from === me) owned.delete(tokenId);
    if (to === me) owned.add(tokenId);
  }

  // 3) Validated (burn/used)
  const validated = await contract.queryFilter(contract.filters.TicketValidated());
  for (const ev of validated) {
    const args = ev.args;
    if (!args) continue;
    const tokenId = Number(args[0]);
    const owner = String(args[1]).toLowerCase();
    if (owner === me) owned.delete(tokenId);
  }

  return Array.from(owned).sort((a, b) => a - b);
}