import { ec, hash } from "starknet";

/**
 * Verifies a Starknet signature using the public key directly.
 * @param pubkey Hex string of the public key (e.g., "0x...")
 * @param hash Hex string of the message hash
 * @param signature Array of two hex strings [r, s]
 * @returns true if valid, false otherwise
 */

export const localVerify = (
  pubkey: string,
  hash: string,
  signature: string[]
): boolean => {
  try {
    if (signature.length !== 2) {
      throw new Error("Signature must be an array of two elements [r, s]");
    }

    // const [r, s] = signature.map(BigInt);
    const r = BigInt(signature[0]);
    const s = BigInt(signature[1]);
    const msgHash = BigInt(hash);
    const publicKey = BigInt(pubkey);

    console.log(ec.starkCurve.verify.toString());
    return ec.starkCurve.verify([r, s], msgHash, publicKey);
  } catch (e) {
    return false;
  }
};
