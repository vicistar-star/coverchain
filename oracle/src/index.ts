import { OracleAggregator } from "./aggregator.js";

const ORACLE_INDEX = process.env.ORACLE_INDEX || "1";

async function main() {
  console.log(`CoverChain Oracle #${ORACLE_INDEX} starting...`);
  console.log(`Network: ${process.env.STELLAR_NETWORK || "testnet"}`);
  console.log(`RPC URL: ${process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"}`);

  const secretKeyVar = `ORACLE_${ORACLE_INDEX}_SECRET_KEY`;
  const oracleSecretKey = process.env[secretKeyVar] || process.env.ORACLE_1_SECRET_KEY;

  if (!oracleSecretKey) {
    console.error(`FATAL: ${secretKeyVar} not set in environment`);
    process.exit(1);
  }

  const aggregator = new OracleAggregator({
    oracleSecretKey,
    oracleConsensusContractId: process.env.ORACLE_CONSENSUS_CONTRACT_ID || "",
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "300000", 10),
  });

  try {
    await aggregator.initialize();
    console.log("OracleAggregator initialized. Keypair loaded.");

    aggregator.start();
  } catch (error: any) {
    console.error(`FATAL: ${error.message}`);
    process.exit(1);
  }

  process.on("SIGINT", () => {
    console.log("\nShutting down Oracle Aggregator...");
    aggregator.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down Oracle Aggregator...");
    aggregator.stop();
    process.exit(0);
  });
}

main();
