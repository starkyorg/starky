export const STELLAR_ENABLED =
  process.env.NEXT_PUBLIC_STELLAR_ENABLED === "true";

export const getStellarHorizonUrl = (
  network: "stellar-mainnet" | "stellar-testnet"
) => {
  switch (network) {
    case "stellar-mainnet":
      return "https://horizon.stellar.org";
    case "stellar-testnet":
      return "https://horizon-testnet.stellar.org";
    default:
      return "https://horizon-testnet.stellar.org";
  }
};

export const getStellarNetworkPassphrase = (
  network: "stellar-mainnet" | "stellar-testnet"
) => {
  switch (network) {
    case "stellar-mainnet":
      return "Public Global Stellar Network ; September 2015";
    case "stellar-testnet":
      return "Test SDF Network ; September 2015";
    default:
      return "Test SDF Network ; September 2015";
  }
};
