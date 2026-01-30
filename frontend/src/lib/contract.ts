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
