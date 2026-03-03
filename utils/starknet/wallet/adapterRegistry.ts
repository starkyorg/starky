import { createCartridgeAdapter } from "./cartridgeAdapter";
import { isCartridgeControllerEnabled } from "./featureFlags";
import { createLegacyStarknetAdapter } from "./legacyAdapter";
import { StarknetWalletAdapter } from "./types";

export const getVerificationAdapters = (
  featureFlagEnabled = isCartridgeControllerEnabled()
): StarknetWalletAdapter[] => {
  const adapters: StarknetWalletAdapter[] = [createLegacyStarknetAdapter()];
  if (featureFlagEnabled) {
    adapters.push(createCartridgeAdapter());
  }
  return adapters;
};

