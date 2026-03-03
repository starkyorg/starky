import { verifySignature } from "../../utils/starknet/verifySignature";
import { callContract } from "../../utils/starknet/call";

jest.mock("../../utils/starknet/call", () => ({
  callContract: jest.fn(),
}));

jest.mock("../../utils/discord/logs", () => ({
  log: jest.fn(),
}));

const mockedCallContract = callContract as jest.MockedFunction<typeof callContract>;

describe("verifySignature", () => {
  beforeEach(() => {
    mockedCallContract.mockReset();
  });

  it("validates signature from primary isValidSignature entrypoint", async () => {
    mockedCallContract.mockResolvedValueOnce({ result: ["0x1"] } as any);

    const result = await verifySignature("0xabc", "0xhash", ["1", "2"], "mainnet");

    expect(result).toEqual({ signatureValid: true, error: undefined });
    expect(mockedCallContract).toHaveBeenCalledWith(
      expect.objectContaining({ entrypoint: "isValidSignature" })
    );
  });

  it("falls back to is_valid_signature and validates success", async () => {
    mockedCallContract.mockRejectedValueOnce(new Error("primary failed"));
    mockedCallContract.mockResolvedValueOnce({ result: ["0x56414c4944"] } as any);

    const result = await verifySignature("0xabc", "0xhash", ["1", "2"], "mainnet");

    expect(result).toEqual({ signatureValid: true, error: undefined });
    expect(mockedCallContract).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ entrypoint: "is_valid_signature" })
    );
  });

  it("returns explicit invalid signature error on empty response", async () => {
    mockedCallContract.mockResolvedValueOnce({ result: [] } as any);

    const result = await verifySignature("0xabc", "0xhash", ["1", "2"], "mainnet");

    expect(result).toEqual({
      signatureValid: false,
      error: "Invalid signature: received empty result",
    });
  });

  it("returns deterministic failure object when contract calls throw", async () => {
    mockedCallContract
      .mockRejectedValueOnce({ message: "first", errorCode: "CALL_FAILED" })
      .mockRejectedValueOnce({ message: "second", errorCode: "FALLBACK_FAILED" });

    const result = await verifySignature("0xabc", "0xhash", ["1", "2"], "mainnet");

    expect(result).toEqual({
      signatureValid: false,
      error: "second",
    });
  });
});
