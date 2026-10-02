import StellarSdk from 'stellar-sdk';

/**
 * Retrieves the balance of a specific token for a given public key on the Stellar network.
 * 
 * @param publicKey - The public key of the user account.
 * @param assetCode - The asset code of the token (e.g., 'USDC').
 * @param assetIssuer - The public key of the asset issuer.
 * @returns A promise that resolves to the balance as a string. Returns '0' if the token is not held.
 * @throws Error if the network request fails or the account is not found.
 */
export async function getTokenBalance(
  publicKey: string,
  assetCode: string,
  assetIssuer: string
): Promise<string> {
  try {
    // Initialize the server (Horizon)
    const server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');

    // Fetch account details
    const account = await server.accounts().strictGet(publicKey);

    // Find the balance that matches the asset code and issuer
    const balanceEntry = account.balances.find(
      (balance) =>
        balance.asset_type === 'native' 
          ? false // Skip native XLM if we are looking for a specific token
          : balance.asset_code === assetCode && balance.asset_issuer === assetIssuer
    );

    return balanceEntry ? balanceEntry.balance : '0';
  } catch (error: any) {
    // If the account is not found (404), we return '0' as they don't hold any tokens
    if (error.response && error.response.status === 404) {
      return '0';
    }
    
    console.error(`Error fetching balance for ${publicKey}:`, error);
    throw new Error(`Failed to retrieve token balance: ${error.message}`);
  }
}
