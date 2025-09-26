export type StarknetNetworkName = "mainnet" | "goerli" | "sepolia";
export type StellarNetworkName = "stellar-mainnet" | "stellar-testnet";
export type NetworkName =
  | StarknetNetworkName
  | "ethereum-mainnet"
  | StellarNetworkName;
export type ChainType = "starknet" | "ethereum" | "stellar";
