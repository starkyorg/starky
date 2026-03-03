import { StarknetNetworkName } from "../../types/networks";
import { isExpectedStarknetNetwork } from "../../utils/starknet/wallet/network";

const aliases: Record<StarknetNetworkName, string[]> = {
  mainnet: ["SN_MAIN", "0x534e5f4d41494e"],
  goerli: ["SN_GOERLI", "0x534e5f474f45524c49"],
  sepolia: ["SN_SEPOLIA", "0x534e5f5345504f4c4941"],
};

describe("isExpectedStarknetNetwork", () => {
  it("resolves known alias chain IDs to the expected network", () => {
    expect(isExpectedStarknetNetwork("0x534E5F4D41494E", "mainnet", aliases)).toBe(
      true
    );
    expect(isExpectedStarknetNetwork("sn_main", "mainnet", aliases)).toBe(true);
  });

  it("fails validation for unknown chain IDs", () => {
    expect(isExpectedStarknetNetwork("0xdeadbeef", "mainnet", aliases)).toBe(
      false
    );
    expect(isExpectedStarknetNetwork("", "mainnet", aliases)).toBe(false);
  });

  it("stays wallet-brand agnostic by validating only chain aliases", () => {
    expect(isExpectedStarknetNetwork("SN_SEPOLIA", "sepolia", aliases)).toBe(
      true
    );
  });
});
