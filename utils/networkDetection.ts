import networks from "../configs/networks.json";
import { NetworkName, ChainType } from "../types/networks";

export interface NetworkConfig {
  label: string;
  name: string;
  url: string;
  chain: ChainType;
  verifyPage: string;
  chainId?: number;
  explorerUrl?: string;
  currency?: string;
  indexer: boolean;
  description: string;
}

export const getNetworkConfig = (
  networkName: NetworkName
): NetworkConfig | null => {
  return (
    (networks.find(
      (network) => network.name === networkName
    ) as NetworkConfig) || null
  );
};

export const getChainType = (networkName: NetworkName): ChainType | null => {
  const network = getNetworkConfig(networkName);
  return network?.chain || null;
};

export const getVerifyPageForNetwork = (networkName: NetworkName): string => {
  const network = getNetworkConfig(networkName);
  if (!network) return "verify"; // Default fallback

  // Return the verification page based on chain type
  switch (network.chain) {
    case "starknet":
      return "verify";
    case "ethereum":
      return "verify-eth";
    case "stellar":
      return "verify-stellar";
    default:
      return "verify";
  }
};

export const getAllNetworksByChain = (
  chainType: ChainType
): NetworkConfig[] => {
  return networks.filter(
    (network) => (network as NetworkConfig).chain === chainType
  ) as NetworkConfig[];
};

export const getNetworksByChain = {
  starknet: () => getAllNetworksByChain("starknet"),
  ethereum: () => getAllNetworksByChain("ethereum"),
  stellar: () => getAllNetworksByChain("stellar"),
};
