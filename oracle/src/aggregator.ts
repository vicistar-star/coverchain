import { Keypair, rpc, Contract, nativeToScVal, TransactionBuilder, BASE_FEE, xdr, Account, Address } from "@stellar/stellar-sdk";
import { getWeatherData, WeatherData } from "./providers/weather.js";
import { evaluateFloodRisk, FloodTriggerResult } from "./triggers/floodTrigger.js";

const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
const ORACLE_SECRET_KEY = process.env.ORACLE_1_SECRET_KEY || "";
const ORACLE_CONSENSUS_CONTRACT_ID = process.env.ORACLE_CONSENSUS_CONTRACT_ID || "";
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "300000", 10);
const EVIDENCE_CID_PREFIX = process.env.EVIDENCE_CID_PREFIX || "coverchain-mock://";

export interface OracleConfig {
  rpcUrl: string;
  networkPassphrase: string;
  oracleSecretKey: string;
  oracleConsensusContractId: string;
  pollIntervalMs: number;
}

export interface AggregatorReport {
  eventId: string;
  eventType: string;
  location: string;
  severity: number;
  timestamp: number;
  weatherData: WeatherData;
  triggerResult: FloodTriggerResult;
  txHash?: string;
}

async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourceKeypair: Keypair
): Promise<{ hash: string; returnValue?: any }> {
  const server = new rpc.Server(RPC_URL);
  const contract = new Contract(contractId);
  const sourcePubKey = sourceKeypair.publicKey();

  let account: Account;
  try {
    account = await server.getAccount(sourcePubKey);
  } catch {
    throw new Error(`Oracle account ${sourcePubKey} not found on network`);
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
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
    return { hash: sendResponse.hash, returnValue: result.returnValue };
  }
  throw new Error(`Transaction failed: ${JSON.stringify(result)}`);
}

function hashLocation(location: string): string {
  let hash = 0;
  for (let i = 0; i < location.length; i++) {
    const char = location.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const buf = Buffer.alloc(32);
  buf.writeUInt32BE(Math.abs(hash), 0);
  return buf.toString("hex");
}

export class OracleAggregator {
  private config: OracleConfig;
  private keypair: Keypair | null = null;
  private running = false;

  constructor(configOverride?: Partial<OracleConfig>) {
    this.config = {
      rpcUrl: RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      oracleSecretKey: ORACLE_SECRET_KEY,
      oracleConsensusContractId: ORACLE_CONSENSUS_CONTRACT_ID,
      pollIntervalMs: POLL_INTERVAL_MS,
      ...configOverride,
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.oracleSecretKey) {
      throw new Error("Oracle secret key not configured");
    }
    if (!this.config.oracleConsensusContractId) {
      throw new Error("OracleConsensus contract ID not configured");
    }
    this.keypair = Keypair.fromSecret(this.config.oracleSecretKey);
  }

  async checkAndSubmit(
    location: string
  ): Promise<AggregatorReport> {
    if (!this.keypair) {
      throw new Error("OracleAggregator not initialized");
    }

    const weatherData = await getWeatherData(location);
    const triggerResult = evaluateFloodRisk(weatherData);

    const eventType = "FLOOD";
    const locHash = hashLocation(location);
    const evidenceCid = `${EVIDENCE_CID_PREFIX}${location.toLowerCase()}-${weatherData.timestamp}`;

    let txHash: string | undefined;
    if (triggerResult.triggered) {
      try {
        const oracleScAddr = new Address(this.keypair.publicKey()).toScVal();
        const eventTypeVal = nativeToScVal(eventType, { type: "symbol" });
        const locationHash = xdr.ScVal.scvBytes(Buffer.from(locHash, "hex"));
        const severityVal = nativeToScVal(triggerResult.severity, { type: "u32" });
        const timestampVal = nativeToScVal(weatherData.timestamp, { type: "u64" });
        const evidenceCidVal = nativeToScVal(evidenceCid, { type: "string" });

        const result = await invokeContract(
          this.config.oracleConsensusContractId,
          "submit_event",
          [oracleScAddr, eventTypeVal, locationHash, severityVal, timestampVal, evidenceCidVal],
          this.keypair
        );
        txHash = result.hash;
      } catch (error: any) {
        console.error(`Failed to submit event to contract: ${error.message}`);
      }
    }

    return {
      eventId: `${eventType}-${locHash}`,
      eventType,
      location,
      severity: triggerResult.severity,
      timestamp: weatherData.timestamp,
      weatherData,
      triggerResult,
      txHash,
    };
  }

  start(locations?: string[]): void {
    if (this.running) return;
    this.running = true;

    const defaultLocations = ["LAGOS", "PORT HARCOURT", "KANO", "IBADAN", "ABUJA"];
    const targets = locations || defaultLocations;

    console.log(`Oracle Aggregator started. Polling every ${this.config.pollIntervalMs}ms`);
    console.log(`Monitoring locations: ${targets.join(", ")}`);

    const poll = async () => {
      if (!this.running) return;
      for (const location of targets) {
        try {
          const report = await this.checkAndSubmit(location);
          if (report.triggerResult.triggered) {
            console.log(
              `[${new Date().toISOString()}] TRIGGERED: ${location} severity=${report.severity} ` +
              `rainfall=${report.weatherData.rainfallMm}mm tx=${report.txHash || "N/A"}`
            );
          } else {
            console.log(
              `[${new Date().toISOString()}] OK: ${location} rainfall=${report.weatherData.rainfallMm}mm`
            );
          }
        } catch (error: any) {
          console.error(`[${new Date().toISOString()}] ERROR polling ${location}: ${error.message}`);
        }
      }
    };

    poll();
    setInterval(poll, this.config.pollIntervalMs);
  }

  stop(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}
