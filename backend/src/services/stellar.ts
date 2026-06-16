import { Keypair, rpc, Networks, TransactionBuilder, BASE_FEE, Account } from "@stellar/stellar-sdk";

const STELLAR_NETWORK = process.env.STELLAR_NETWORK || "testnet";
const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

export function createKeypair(): Keypair {
  return Keypair.random();
}

export function loadKeypair(secretKey: string): Keypair {
  return Keypair.fromSecret(secretKey);
}

export function getServer(): rpc.Server {
  return new rpc.Server(RPC_URL);
}

export function getNetworkPassphrase(): string {
  return NETWORK_PASSPHRASE;
}

export function getRpcUrl(): string {
  return RPC_URL;
}

export function getNetwork(): string {
  return STELLAR_NETWORK;
}

export async function getAccount(publicKey: string): Promise<Account> {
  const server = getServer();
  return server.getAccount(publicKey);
}

export async function fundTestnetAccount(publicKey: string): Promise<void> {
  if (STELLAR_NETWORK !== "testnet") {
    throw new Error("Friendbot only available on testnet");
  }
  const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Friendbot error: ${text}`);
  }
}

export async function getAccountBalance(publicKey: string): Promise<string> {
  try {
    const server = getServer();
    const account = await server.getAccount(publicKey);
    return account.accountId() ? "10000" : "0";
  } catch {
    throw new Error(`Account ${publicKey} not found on network`);
  }
}

export function isTestnet(): boolean {
  return STELLAR_NETWORK === "testnet";
}

export function isMainnet(): boolean {
  return STELLAR_NETWORK === "mainnet" || STELLAR_NETWORK === "pubnet";
}
