import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@project-serum/anchor";
import idl from "./idl.json";

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const PROGRAM_ID = new PublicKey("PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu");
const JLP_TOKEN = new PublicKey("27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4");
const USD_DECIMALS = 6;
const POOL_PUBKEY = new PublicKey(
  "5BUwFW4nRbftYTDMbgxykoFWqWHPzahFSNAaaaJtVKsq"
);
const CUSTODY_PUBKEYS = [
  {
    symbol: "SOL",
    pubkey: new PublicKey("7xS2gz2bTp3fwCC7knJvUWTEU9Tycczu6VhJYKgi1wdz"),
  },
  {
    symbol: "BTC",
    pubkey: new PublicKey("5Pv3gM9JrFFH883SWAhvJC9RPYmo8UNxuFtv5bMMALkm"),
  },
  {
    symbol: "ETH",
    pubkey: new PublicKey("AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn"),
  },
  {
    symbol: "USDC",
    pubkey: new PublicKey("G18jKKXQwBbrHeiK3C9MRXhkHsLHf7XgCSisykV46EZa"),
  },
  {
    symbol: "USDT",
    pubkey: new PublicKey("4vkNeXiYEUizLdrpdPS1eC2mccyM4NUPRtERrk6ZETkk"),
  },
];

async function main() {
  const connection = new Connection(RPC_ENDPOINT);
  // AnchorProvider requires a wallet, but for read-only you can use an empty object as any
  const provider = new AnchorProvider(connection, {} as any, {});
  const program = new Program(idl as Idl, PROGRAM_ID, provider);

  // Fetch JLP token supply
  const supplyResp = await connection.getTokenSupply(JLP_TOKEN);
  const supply = supplyResp.value.uiAmount;

  // Fetch pool info
  const pool = await program.account.pool.fetch(POOL_PUBKEY);
  const poolAum = Number(pool.aumUsd) / 10 ** USD_DECIMALS;
  const poolLimitUsd = Number(pool.limit.maxAumUsd) / 10 ** USD_DECIMALS;
  const poolAprBps = Number(pool.poolApr.feeAprBps);
  const poolRealizedFee =
    Number(pool.poolApr.realizedFeeUsd) / 10 ** USD_DECIMALS;
  if (supply == null) throw new Error("Token supply is null!");
  const theoPrice = poolAum / supply;

  // Print Pool Info
  console.log("\n=== Pool Info ===");
  console.log(`Timestamp: ${Date.now()}`);
  console.log(`Pool AUM (USD): ${poolAum}`);
  console.log(`Supply: ${supply}`);
  console.log(`Pool Limit (USD): ${poolLimitUsd}`);
  console.log(`Pool APR (bps): ${poolAprBps}`);
  console.log(`Pool Realized Fee (USD): ${poolRealizedFee}`);
  console.log(`Theoretical Price: ${theoPrice}`);

  // Fetch custody data
  console.log("\n=== Custody Data ===");
  for (const { symbol, pubkey } of CUSTODY_PUBKEYS) {
    const custody = await program.account.custody.fetch(pubkey);
    const decimals = custody.decimals;
    console.log(`\nToken: ${symbol}`);
    console.log(`Target Ratio (bps): ${Number(custody.targetRatioBps)}`);
    console.log(
      `Max Global Long Sizes: ${
        Number(custody.pricing.maxGlobalLongSizes) / 10 ** 6
      }`
    );
    console.log(
      `Max Global Short Sizes: ${
        Number(custody.pricing.maxGlobalShortSizes) / 10 ** 6
      }`
    );
    console.log(
      `Fees Reserves: ${Number(custody.assets.feesReserves) / 10 ** decimals}`
    );
    console.log(`Owned: ${Number(custody.assets.owned) / 10 ** decimals}`);
    console.log(`Locked: ${Number(custody.assets.locked) / 10 ** decimals}`);
    console.log(
      `Guaranteed USD: ${Number(custody.assets.guaranteedUsd) / 10 ** 6}`
    );
    console.log(
      `Global Short Sizes: ${Number(custody.assets.globalShortSizes) / 10 ** 6}`
    );
    console.log(
      `Global Short Average Prices: ${
        Number(custody.assets.globalShortAveragePrices) / 10 ** 6
      }`
    );
    console.log("-".repeat(30));
  }
}

main().catch(console.error);
