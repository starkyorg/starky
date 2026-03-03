import chainAliasByNetwork from "../../../configs/chainAliasByNetwork.json";
import { StarknetNetworkName } from "../../../types/networks";

export type ChainAliasByNetwork = Record<StarknetNetworkName, string[]>;

const normalize = (value: string | null | undefined) =>
  (value || "").toLowerCase();

export const isExpectedStarknetNetwork = (
  chainId: string | null | undefined,
  expectedNetwork: StarknetNetworkName,
  aliases = chainAliasByNetwork as ChainAliasByNetwork
) => {
  if (!chainId) return false;

  const expectedAliases = aliases[expectedNetwork] || [];
  const normalizedChainId = normalize(chainId);

  return expectedAliases.some(
    (alias) => normalize(alias) === normalizedChainId
  );
};

export const resolveStarknetNetworkFromChainId = (
  chainId: string | null | undefined,
  aliases = chainAliasByNetwork as ChainAliasByNetwork
): StarknetNetworkName | undefined => {
  if (!chainId) return undefined;
  const normalizedChainId = normalize(chainId);
  const networks = Object.keys(aliases) as StarknetNetworkName[];

  return networks.find((networkName) =>
    (aliases[networkName] || []).some(
      (alias) => normalize(alias) === normalizedChainId
    )
  );
};

