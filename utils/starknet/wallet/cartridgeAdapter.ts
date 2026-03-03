import {
  connect as starknetConnect,
  disconnect as starknetDisconnect,
} from "starknetkit";

import { WalletAdapterError, toWalletAdapterError } from "./errors";
import { StarknetWalletAdapter, WalletConnection } from "./types";

type ConnectResponse = {
  wallet?: any;
};

type CartridgeAdapterDeps = {
  connector?: () => Promise<ConnectResponse>;
  disconnector?: () => Promise<void>;
};

const getChainId = (wallet: any) =>
  wallet.account?.provider?.chainId || wallet.provider?.chainId || wallet.chainId;

const isCartridgeWallet = (wallet: any) =>
  (wallet.id || "").toLowerCase().includes("cartridge");

export const createCartridgeAdapter = (
  deps: CartridgeAdapterDeps = {}
): StarknetWalletAdapter => {
  const connector = deps.connector || starknetConnect;
  const disconnector = deps.disconnector || starknetDisconnect;
  let currentConnection: WalletConnection | null = null;

  return {
    id: "cartridge",
    connect: async () => {
      try {
        const { wallet } = await connector();
        if (!wallet?.account?.address || !isCartridgeWallet(wallet)) {
          throw new WalletAdapterError(
            "WALLET_UNAVAILABLE",
            "Cartridge Controller wallet is unavailable"
          );
        }

        const chainId = getChainId(wallet);
        if (!chainId) {
          throw new WalletAdapterError(
            "CONNECT_FAILED",
            "Connected Cartridge wallet did not expose a Starknet chain ID"
          );
        }

        const connection: WalletConnection = {
          address: wallet.account.address.toLowerCase(),
          chainId,
          account: wallet.account,
          walletId: wallet.id,
          wallet,
        };
        currentConnection = connection;

        return connection;
      } catch (error) {
        throw toWalletAdapterError(
          error,
          "CONNECT_FAILED",
          "Unable to connect Cartridge Controller"
        );
      }
    },
    disconnect: async () => {
      try {
        await disconnector();
      } catch (error) {
        currentConnection = null;
        throw toWalletAdapterError(
          error,
          "DISCONNECT_FAILED",
          "Unable to disconnect Cartridge Controller"
        );
      }
      currentConnection = null;
    },
    signMessage: async (message: unknown) => {
      if (!currentConnection?.account?.signMessage) {
        throw new WalletAdapterError("NOT_CONNECTED", "Wallet is not connected");
      }

      try {
        return await currentConnection.account.signMessage(message);
      } catch (error) {
        throw toWalletAdapterError(error, "SIGN_FAILED", "Unable to sign message");
      }
    },
  };
};
