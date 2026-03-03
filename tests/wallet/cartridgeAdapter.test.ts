import { createCartridgeAdapter } from "../../utils/starknet/wallet/cartridgeAdapter";

describe("cartridge adapter", () => {
  it("connects and returns normalized address and chainId", async () => {
    const adapter = createCartridgeAdapter({
      connector: async () => ({
        wallet: {
          id: "cartridge-controller",
          chainId: "SN_SEPOLIA",
          provider: { chainId: "SN_SEPOLIA" },
          account: {
            address: "0xCAFE",
            signMessage: async () => ["0x1", "0x2"],
            provider: { chainId: "SN_SEPOLIA" },
          },
        },
      }),
      disconnector: async () => undefined,
    });

    const connection = await adapter.connect();

    expect(connection.address).toBe("0xcafe");
    expect(connection.chainId).toBe("SN_SEPOLIA");
  });

  it("throws wallet unavailable when cartridge is not detected", async () => {
    const adapter = createCartridgeAdapter({
      connector: async () => ({
        wallet: {
          id: "braavos",
          chainId: "SN_SEPOLIA",
          provider: { chainId: "SN_SEPOLIA" },
          account: {
            address: "0xCAFE",
            signMessage: async () => ["0x1", "0x2"],
            provider: { chainId: "SN_SEPOLIA" },
          },
        },
      }),
      disconnector: async () => undefined,
    });

    await expect(adapter.connect()).rejects.toMatchObject({
      code: "WALLET_UNAVAILABLE",
    });
  });
});
