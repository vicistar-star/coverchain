import {
  rpc,
  Contract,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  Keypair,
  Account,
  Address,
} from "@stellar/stellar-sdk";
import { getServer, getNetworkPassphrase } from "./stellar";

const CONTRACT_KEYS = {
  POLICY_REGISTRY: process.env.POLICY_REGISTRY_CONTRACT_ID || "",
  RISK_POOL: process.env.RISK_POOL_CONTRACT_ID || "",
  ORACLE_CONSENSUS: process.env.ORACLE_CONSENSUS_CONTRACT_ID || "",
  USDC: process.env.USDC_CONTRACT_ID || "",
};

export interface EnrollParams {
  holder: string;
  productId: string;
  coverageParams: Record<string, any>;
  premiumAmount: string;
  premiumInterval: number;
}

export interface SubmitEventParams {
  oracleKeypair: Keypair;
  eventType: string;
  locationHash: string;
  severity: number;
  timestamp: number;
  evidenceCid: string;
}

export interface ContractEvent {
  id: string;
  contractId: string;
  type: string;
  topic: string[];
  data: string;
  ledger: number;
  timestamp: number;
}

function scvMapFromRecord(record: Record<string, any>): xdr.ScVal {
  const entries = Object.entries(record).map(([key, value]) => {
    return new xdr.ScMapEntry({
      key: nativeToScVal(key),
      val: nativeToScVal(typeof value === "string" ? value : String(value)),
    });
  });
  return xdr.ScVal.scvMap(entries);
}

async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourceKeypair: Keypair
): Promise<any> {
  const server = getServer();
  const contract = new Contract(contractId);
  const sourcePubKey = sourceKeypair.publicKey();

  let account: Account;
  try {
    account = await server.getAccount(sourcePubKey);
  } catch {
    throw new Error(`Account ${sourcePubKey} not found on network`);
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  preparedTx.sign(sourceKeypair);

  const sendResponse = await server.sendTransaction(preparedTx);
  if (sendResponse.status === "ERROR") {
    throw new Error(`Send failed: ${JSON.stringify(sendResponse)}`);
  }

  const result = await server.getTransaction(sendResponse.hash);
  if (result.status === "SUCCESS") {
    if (result.returnValue) {
      return scValToNative(result.returnValue);
    }
    return null;
  }
  throw new Error(`Transaction failed: ${JSON.stringify(result)}`);
}

export async function enrollPolicy(
  params: EnrollParams,
  holderKeypair: Keypair
): Promise<number> {
  const contractId = CONTRACT_KEYS.POLICY_REGISTRY;
  if (!contractId) throw new Error("POLICY_REGISTRY_CONTRACT_ID not set");

  const holderScAddr = new Address(params.holder).toScVal();
  const productId = nativeToScVal(params.productId, { type: "symbol" });
  const coverageMap = scvMapFromRecord(params.coverageParams);
  const premiumAmount = nativeToScVal(params.premiumAmount, { type: "i128" });
  const premiumInterval = nativeToScVal(params.premiumInterval, { type: "u64" });

  const result = await invokeContract(
    contractId,
    "enroll",
    [holderScAddr, productId, coverageMap, premiumAmount, premiumInterval],
    holderKeypair
  );

  return Number(result);
}

export async function getPolicy(
  policyId: number
): Promise<any> {
  const contractId = CONTRACT_KEYS.POLICY_REGISTRY;
  if (!contractId) throw new Error("POLICY_REGISTRY_CONTRACT_ID not set");

  return invokeContract(contractId, "get_policy", [nativeToScVal(policyId, { type: "u64" })], getSystemKeypair());
}

export async function isPolicyActive(policyId: number): Promise<boolean> {
  const contractId = CONTRACT_KEYS.POLICY_REGISTRY;
  if (!contractId) throw new Error("POLICY_REGISTRY_CONTRACT_ID not set");

  const result = await invokeContract(
    contractId,
    "is_active",
    [nativeToScVal(policyId, { type: "u64" })],
    getSystemKeypair()
  );
  return Boolean(result);
}

export async function depositPremium(
  fromKeypair: Keypair,
  policyId: number,
  amount: string
): Promise<void> {
  const contractId = CONTRACT_KEYS.RISK_POOL;
  if (!contractId) throw new Error("RISK_POOL_CONTRACT_ID not set");

  const fromAddr = new Address(fromKeypair.publicKey()).toScVal();
  const policyIdVal = nativeToScVal(policyId, { type: "u64" });
  const amountVal = nativeToScVal(amount, { type: "i128" });

  await invokeContract(contractId, "deposit_premium", [fromAddr, policyIdVal, amountVal], fromKeypair);
}

export async function getPoolBalance(): Promise<string> {
  const contractId = CONTRACT_KEYS.RISK_POOL;
  if (!contractId) throw new Error("RISK_POOL_CONTRACT_ID not set");

  const result = await invokeContract(contractId, "pool_balance", [], getSystemKeypair());
  return String(result);
}

export async function getPoolHealthRatio(): Promise<number> {
  const contractId = CONTRACT_KEYS.RISK_POOL;
  if (!contractId) throw new Error("RISK_POOL_CONTRACT_ID not set");

  const result = await invokeContract(contractId, "get_health_ratio", [], getSystemKeypair());
  return Number(result);
}

export async function isOracleRegistered(oracleAddress: string): Promise<boolean> {
  const contractId = CONTRACT_KEYS.ORACLE_CONSENSUS;
  if (!contractId) throw new Error("ORACLE_CONSENSUS_CONTRACT_ID not set");

  const oracleScAddr = new Address(oracleAddress).toScVal();
  const result = await invokeContract(
    contractId,
    "is_registered",
    [oracleScAddr],
    getSystemKeypair()
  );
  return Boolean(result);
}

export async function submitOracleEvent(
  params: SubmitEventParams
): Promise<number> {
  const contractId = CONTRACT_KEYS.ORACLE_CONSENSUS;
  if (!contractId) throw new Error("ORACLE_CONSENSUS_CONTRACT_ID not set");

  const oracleScAddr = new Address(params.oracleKeypair.publicKey()).toScVal();
  const eventType = nativeToScVal(params.eventType, { type: "symbol" });
  const locationHash = xdr.ScVal.scvBytes(Buffer.from(params.locationHash, "hex"));
  const severity = nativeToScVal(params.severity, { type: "u32" });
  const timestamp = nativeToScVal(params.timestamp, { type: "u64" });
  const evidenceCid = nativeToScVal(params.evidenceCid, { type: "string" });

  const result = await invokeContract(
    contractId,
    "submit_event",
    [oracleScAddr, eventType, locationHash, severity, timestamp, evidenceCid],
    params.oracleKeypair
  );

  return Number(result);
}

export async function checkAndExecutePayout(
  adminKeypair: Keypair,
  eventId: number,
  riskPoolContractId: string,
  policyId: number,
  recipient: string,
  amount: string
): Promise<boolean> {
  const contractId = CONTRACT_KEYS.ORACLE_CONSENSUS;
  if (!contractId) throw new Error("ORACLE_CONSENSUS_CONTRACT_ID not set");

  const eventIdVal = nativeToScVal(eventId, { type: "u64" });
  const riskPoolAddr = new Address(riskPoolContractId).toScVal();
  const policyIdVal = nativeToScVal(policyId, { type: "u64" });
  const recipientAddr = new Address(recipient).toScVal();
  const amountVal = nativeToScVal(amount, { type: "i128" });

  const result = await invokeContract(
    contractId,
    "check_and_execute",
    [eventIdVal, riskPoolAddr, policyIdVal, recipientAddr, amountVal],
    adminKeypair
  );

  return Boolean(result);
}

export async function getOracleEvent(eventId: number): Promise<any> {
  const contractId = CONTRACT_KEYS.ORACLE_CONSENSUS;
  if (!contractId) throw new Error("ORACLE_CONSENSUS_CONTRACT_ID not set");

  return invokeContract(
    contractId,
    "get_event",
    [nativeToScVal(eventId, { type: "u64" })],
    getSystemKeypair()
  );
}

export async function listenForContractEvents(
  contractId: string,
  fromLedger?: number,
  maxEvents: number = 100
): Promise<ContractEvent[]> {
  const server = getServer();
  const events: ContractEvent[] = [];

  const start = fromLedger ?? 1;
  try {
    const eventResponse = await server.getEvents({
      filters: [{ type: "contract" as const, contractIds: [contractId] }],
      startLedger: start,
      limit: maxEvents,
    });

    for (const event of eventResponse.events) {
      const evt = event as any;
      events.push({
        id: evt.id,
        contractId: evt.contractId || contractId,
        type: evt.type,
        topic: (evt.topic || []).map((t: any) => String(t)),
        data: typeof evt.value === "string" ? evt.value : JSON.stringify(evt.value),
        ledger: evt.ledger,
        timestamp: Date.now(),
      });
    }
  } catch {
    throw new Error("Failed to fetch contract events");
  }

  return events;
}

export async function getLatestLedger(): Promise<number> {
  const server = getServer();
  const ledger = await server.getLatestLedger();
  return Number(ledger.sequence);
}

function getSystemKeypair(): Keypair {
  const secret = process.env.DEPLOYER_SECRET_KEY;
  if (secret) {
    return Keypair.fromSecret(secret);
  }
  return Keypair.random();
}

export function getContractAddresses() {
  return { ...CONTRACT_KEYS };
}

export function hasRequiredContracts(): boolean {
  return Boolean(
    CONTRACT_KEYS.POLICY_REGISTRY &&
    CONTRACT_KEYS.RISK_POOL &&
    CONTRACT_KEYS.ORACLE_CONSENSUS
  );
}
