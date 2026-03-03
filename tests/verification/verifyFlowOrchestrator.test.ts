import messageToSign from "../../utils/starknet/message";
import { WalletAdapterError } from "../../utils/starknet/wallet/errors";
import {
  createVerifyFlowOrchestrator,
  VerifyRequestInput,
} from "../../utils/starknet/wallet/verifyFlowOrchestrator";

describe("verify flow orchestrator", () => {
  const verifyRequest: VerifyRequestInput = {
    discordServerId: "1",
    discordMemberId: "2",
    customLink: "abc",
    network: "sepolia",
  };

  it("connect success on valid network triggers signing and verify API submit", async () => {
    const submitVerification = jest.fn().mockResolvedValue(undefined);
    const signMessage = jest.fn().mockResolvedValue(["0x1", "0x2"]);

    const orchestrator = createVerifyFlowOrchestrator({
      adapter: {
        id: "legacy",
        connect: async () => ({
          address: "0xabc",
          chainId: "SN_SEPOLIA",
          account: { address: "0xabc" },
        }),
        disconnect: async () => undefined,
        signMessage,
      },
      submitVerification,
      messageTemplate: messageToSign,
    });

    const result = await orchestrator.run(verifyRequest);

    expect(result.status).toBe("verified");
    expect(signMessage).toHaveBeenCalledTimes(1);
    expect(submitVerification).toHaveBeenCalledWith({
      account: "0xabc",
      signature: ["0x1", "0x2"],
      discordServerId: "1",
      discordMemberId: "2",
      customLink: "abc",
      network: "sepolia",
    });
  });

  it("wrong network blocks signing and returns mismatch state", async () => {
    const submitVerification = jest.fn().mockResolvedValue(undefined);
    const signMessage = jest.fn().mockResolvedValue(["0x1", "0x2"]);

    const orchestrator = createVerifyFlowOrchestrator({
      adapter: {
        id: "legacy",
        connect: async () => ({
          address: "0xabc",
          chainId: "SN_MAIN",
          account: { address: "0xabc" },
        }),
        disconnect: async () => undefined,
        signMessage,
      },
      submitVerification,
      messageTemplate: messageToSign,
    });

    const result = await orchestrator.run(verifyRequest);

    expect(result).toMatchObject({ status: "wrong_network", chainId: "SN_MAIN" });
    expect(signMessage).not.toHaveBeenCalled();
    expect(submitVerification).not.toHaveBeenCalled();
  });

  it("maps adapter failures to user-facing error state", async () => {
    const orchestrator = createVerifyFlowOrchestrator({
      adapter: {
        id: "cartridge",
        connect: async () => {
          throw new WalletAdapterError(
            "WALLET_UNAVAILABLE",
            "No cartridge wallet found"
          );
        },
        disconnect: async () => undefined,
        signMessage: async () => ["0x1", "0x2"],
      },
      submitVerification: async () => undefined,
      messageTemplate: messageToSign,
    });

    const result = await orchestrator.run(verifyRequest);

    expect(result).toMatchObject({
      status: "error",
      errorCode: "connect_failed",
      shortMessage: expect.stringContaining("wallet"),
    });
  });
});
