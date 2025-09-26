import * as StellarSdk from "stellar-sdk";
import { getStellarHorizonUrl } from "./stellarEnv";

export const verifySignature = async (
  publicKey: string,
  message: string,
  signedTxXdr: string,
  network: string
): Promise<{ signatureValid: boolean; error?: string }> => {
  try {
    console.log("Verifying Stellar signature for:", publicKey);
    console.log("Message:", message);
    console.log("Signed XDR:", signedTxXdr);

    // Basic validation - check if public key is valid Stellar address
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith("G")) {
      return {
        signatureValid: false,
        error: "Invalid Stellar public key format",
      };
    }

    // Check if signature (XDR) is provided
    if (!signedTxXdr || signedTxXdr.length === 0) {
      return {
        signatureValid: false,
        error: "No signed transaction provided",
      };
    }

    // Check if the account exists on the Stellar network
    const horizonUrl = getStellarHorizonUrl(
      network as "stellar-mainnet" | "stellar-testnet"
    );
    const server = new StellarSdk.Horizon.Server(horizonUrl);

    try {
      await server.loadAccount(publicKey);
    } catch (error) {
      return {
        signatureValid: false,
        error: "Stellar account not found on network",
      };
    }

    try {
      // Parse the signed transaction XDR
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        StellarSdk.Networks.TESTNET // or StellarSdk.Networks.PUBLIC for mainnet
      );

      console.log("Parsed transaction:", transaction);

      // Verify the transaction is signed by the correct account
      let sourceAccount: string;
      if ("source" in transaction) {
        sourceAccount = transaction.source;
      } else {
        // For FeeBumpTransaction, use the inner transaction's source
        sourceAccount = transaction.innerTransaction.source;
      }

      if (sourceAccount !== publicKey) {
        return {
          signatureValid: false,
          error: "Transaction not signed by the expected account",
        };
      }

      // Check if the transaction has signatures
      if (transaction.signatures.length === 0) {
        return {
          signatureValid: false,
          error: "No signatures found in transaction",
        };
      }

      // Verify signature using Stellar SDK
      const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
      const txHash = transaction.hash();

      // Check if any signature is valid for this keypair
      let validSignature = false;
      for (const signature of transaction.signatures) {
        try {
          const isValid = keypair.verify(txHash, signature.signature());
          if (isValid) {
            validSignature = true;
            break;
          }
        } catch (error) {
          console.log("Signature verification failed:", error);
        }
      }

      if (validSignature) {
        return { signatureValid: true };
      } else {
        return {
          signatureValid: false,
          error: "Invalid signature",
        };
      }
    } catch (error: any) {
      console.error("XDR parsing error:", error);
      return {
        signatureValid: false,
        error: `Failed to parse signed transaction: ${error.message}`,
      };
    }
  } catch (error: any) {
    return {
      signatureValid: false,
      error: `Verification failed: ${error.message}`,
    };
  }
};
