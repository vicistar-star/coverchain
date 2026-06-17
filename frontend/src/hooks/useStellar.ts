/**
 * useStellar.ts
 *
 * Hook for Freighter wallet connection and Stellar account data.
 * Freighter API: https://docs.freighter.app/docs/guide/usingFreighterWebApp
 */
import { useState, useCallback, useEffect } from "react";
import {
  isConnected,
  getPublicKey,
  signTransaction,
  setAllowed,
} from "@stellar/freighter-api";
import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

const horizon = new Horizon.Server(HORIZON_URL);

export interface StellarBalance {
  asset: string;
  balance: string;
}

export interface StellarState {
  connected: boolean;
  publicKey: string | null;
  balances: StellarBalance[];
  loading: boolean;
  error: string | null;
}

export interface UseStellarReturn extends StellarState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signTx: (xdr: string) => Promise<string>;
  refreshBalances: () => Promise<void>;
}

export function useStellar(): UseStellarReturn {
  const [state, setState] = useState<StellarState>({
    connected: false,
    publicKey: null,
    balances: [],
    loading: false,
    error: null,
  });

  const setPartial = (patch: Partial<StellarState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const fetchBalances = useCallback(async (pubKey: string) => {
    try {
      const account = await horizon.loadAccount(pubKey);
      const balances: StellarBalance[] = account.balances.map((b) => {
        const line = b as Horizon.HorizonApi.BalanceLine;
        return {
          asset: line.asset_type === "native" ? "XLM" : (line as { asset_code?: string }).asset_code ?? "?",
          balance: b.balance,
        };
      });
      setPartial({ balances });
    } catch {
      setPartial({ balances: [] });
    }
  }, []);

  const connect = useCallback(async () => {
    setPartial({ loading: true, error: null });
    try {
      const connected = await isConnected();
      if (!connected) {
        throw new Error("Freighter wallet not found. Install it at freighter.app");
      }
      // Request permission to access the wallet
      await setAllowed();
      const pubKey = await getPublicKey();
      if (!pubKey) throw new Error("No public key returned from Freighter");

      await fetchBalances(pubKey);
      setPartial({ connected: true, publicKey: pubKey, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wallet connection failed";
      setPartial({ loading: false, error: msg });
    }
  }, [fetchBalances]);

  const disconnect = useCallback(() => {
    setState({ connected: false, publicKey: null, balances: [], loading: false, error: null });
  }, []);

  const signTx = useCallback(async (xdr: string): Promise<string> => {
    return signTransaction(xdr, { networkPassphrase: NETWORK_PASSPHRASE });
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!state.publicKey) return;
    await fetchBalances(state.publicKey);
  }, [state.publicKey, fetchBalances]);

  // Poll for account changes every 5s when connected
  useEffect(() => {
    if (!state.publicKey) return;
    const id = setInterval(async () => {
      const pk = await getPublicKey().catch(() => null);
      if (pk && pk !== state.publicKey) {
        setPartial({ publicKey: pk });
        fetchBalances(pk);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [state.publicKey, fetchBalances]);

  return { ...state, connect, disconnect, signTx, refreshBalances };
}
