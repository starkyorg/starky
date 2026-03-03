import { getVerificationAdapters } from "../../utils/starknet/wallet/adapterRegistry";
import { createLegacyStarknetAdapter } from "../../utils/starknet/wallet/legacyAdapter";

describe("legacy wallet adapter contract", () => {
  it("returns normalized address and chainId", async () => {
    const adapter = createLegacyStarknetAdapter({
      connector: async () => ({
        wallet: {
          id: "braavos",
          chainId: "SN_MAIN",
          provider: { chainId: "SN_MAIN" },
          account: {
            address: "0xABCD",
            signMessage: async () => ["0x1", "0x2"],
            provider: { chainId: "SN_MAIN" },
          },
        },
      }),
      disconnector: async () => undefined,
    });

    const connection = await adapter.connect();

    expect(connection.address).toBe("0xabcd");
    expect(connection.chainId).toBe("SN_MAIN");
  });

  it("throws typed error when wallet is unavailable", async () => {
    const adapter = createLegacyStarknetAdapter({
      connector: async () => ({ wallet: undefined }),
      disconnector: async () => undefined,
    });

    await expect(adapter.connect()).rejects.toMatchObject({
      code: "WALLET_UNAVAILABLE",
    });
  });

  it("disconnect clears connection state", async () => {
    const adapter = createLegacyStarknetAdapter({
      connector: async () => ({
        wallet: {
          id: "braavos",
          chainId: "SN_MAIN",
          provider: { chainId: "SN_MAIN" },
          account: {
            address: "0xabc",
            signMessage: async () => ["0x1", "0x2"],
            provider: { chainId: "SN_MAIN" },
          },
        },
      }),
      disconnector: async () => undefined,
    });

    await adapter.connect();
    await adapter.disconnect();

    await expect(adapter.signMessage({ any: "message" })).rejects.toMatchObject({
      code: "NOT_CONNECTED",
    });
  });
});

describe("feature flag adapter gate", () => {
  it("flag off excludes cartridge adapter", () => {
    const adapters = getVerificationAdapters(false);
    expect(adapters.map((adapter) => adapter.id)).toEqual(["legacy"]);
  });

  it("flag on includes cartridge adapter path", () => {
    const adapters = getVerificationAdapters(true);
    expect(adapters.map((adapter) => adapter.id)).toEqual([
      "legacy",
      "cartridge",
    ]);
  });
});
