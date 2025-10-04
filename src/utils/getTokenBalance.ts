import { Server, Asset } from "stellar-sdk";

// NOTE: Use your project's established Horizon URL
const HORIZON_URL = "https://horizon-testnet.stellar.org/";
export const server = new Server(HORIZON_URL);

/**
 * Retrieves the balance of a specific token for a user on the Stellar network.
 * @param publicKey The user's public key.
 * @param assetCode The asset code (e.g., 'USD', 'XLM').
 * @param assetIssuer The issuer's public key. Use 'native' for XLM.
 * @returns A Promise resolving to the balance as a string, or '0' if not found/error.
 */
export async function getTokenBalance(
  publicKey: string,
  assetCode: string,
  assetIssuer: string
): Promise<string> {
  try {
    // 1. Fetch Account Details
    const account = await server.loadAccount(publicKey);

    // 2. Define Target Asset Identifier
    const targetAsset = assetCode.toUpperCase() === "XLM"
      ? "native"
      : new Asset(assetCode, assetIssuer).toString();

    // 3. Search Balances
    const balanceEntry = account.balances.find((balance: any) => {
      const currentAssetType = balance.asset_type === "native"
        ? "native"
        : new Asset(balance.asset_code!, balance.asset_issuer!).toString();

      return currentAssetType === targetAsset;
    });

    // 4. Return Balance or '0'
    return balanceEntry ? balanceEntry.balance : "0";
  } catch (error) {
    // Log the error for debugging but return '0' as per requirement (user doesn't hold it or account doesn't exist).
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch balance for ${publicKey} (${assetCode}):`, error);
    return "0";
  }
}

export default getTokenBalance;


