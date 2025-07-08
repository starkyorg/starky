import { verifySignature } from "../utils/starknet/verifySignature";
import { callContract } from "../utils/starknet/call";
import { isAccountDeployed } from "../utils/starknet/isAccountDeployed";
import { localVerify } from "../utils/starknet/localVerify";

// ✅ Jest mock setup 
jest.mock("../STARKY/utils/starknet/call");
jest.mock("../STARKY/utils/starknet/isAccountDeployed");
jest.mock("../STARKY/utils/starknet/localVerify");

describe("Signature Verification", () => {
  const accountAddress = "0xabc";
  const messageHash = "0x123";
  const signature = ["0x1", "0x2"];
  const pubkey = "0x999";
  const starknetNetwork = "sepolia";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should validate signature on-chain when account is deployed", async () => {
    (isAccountDeployed as jest.Mock).mockResolvedValue(true);
    (callContract as jest.Mock).mockResolvedValue({
      result: ["0x1"],
    });

    const result = await verifySignature(
      accountAddress,
      messageHash,
      signature,
      starknetNetwork,
      pubkey
    );

    expect(result.signatureValid).toBe(true);
  });

  it("should fall back to local verify when account is undeployed", async () => {
    (isAccountDeployed as jest.Mock).mockResolvedValue(false);
    (localVerify as jest.Mock).mockReturnValue(true);

    const result = await verifySignature(
      accountAddress,
      messageHash,
      signature,
      starknetNetwork,
      pubkey
    );

    expect(result.signatureValid).toBe(true);
    expect(localVerify).toHaveBeenCalledWith(pubkey, messageHash, signature);
  });

  it("should reject if public key is missing for undeployed account", async () => {
    (isAccountDeployed as jest.Mock).mockResolvedValue(false);

    const result = await verifySignature(
      accountAddress,
      messageHash,
      signature,
      starknetNetwork,
      undefined
    );

    expect(result.signatureValid).toBe(false);
    expect(result.error).toMatch(/Missing public key/i);
  });

  it("should reject invalid signature from contract", async () => {
    (isAccountDeployed as jest.Mock).mockResolvedValue(true);
    (callContract as jest.Mock).mockResolvedValue({
      result: ["0x0"],
    });

    const result = await verifySignature(
      accountAddress,
      messageHash,
      signature,
      starknetNetwork,
      pubkey
    );

    expect(result.signatureValid).toBe(false);
  });

  it("should reject invalid local signature", async () => {
    (isAccountDeployed as jest.Mock).mockResolvedValue(false);
    (localVerify as jest.Mock).mockReturnValue(false);

    const result = await verifySignature(
      accountAddress,
      messageHash,
      signature,
      starknetNetwork,
      pubkey
    );

    expect(result.signatureValid).toBe(false);
    expect(result.error).toMatch(/Local verification failed/i);
  });
});
