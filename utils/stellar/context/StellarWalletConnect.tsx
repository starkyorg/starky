"use client";

import { createContext, useContext, useState } from "react";
import {
  isConnected,
  getAddress,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import * as StellarSdk from "stellar-sdk";
import networks from "../../../configs/networks.json";
import {
  getStellarHorizonUrl,
  getStellarNetworkPassphrase,
  STELLAR_ENABLED,
} from "../stellarEnv";
import WatchTowerLogger from "../../../watchTower";

type StellarWalletContextType = {
  connect: (networkName: string) => Promise<void>;
  disconnect: () => void;
  account: string | null;
  networkType: "stellar" | null;
  signMessage: (message: string) => Promise<string>;
  balance: string | null;
  server: StellarSdk.Horizon.Server | null;
};

const StellarWalletContext = createContext<StellarWalletContextType>(
  {} as StellarWalletContextType
);

export function StellarWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [account, setAccount] = useState<string | null>(null);
  const [networkType, setNetworkType] = useState<"stellar" | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [server, setServer] = useState<StellarSdk.Horizon.Server | null>(null);

  const connect = async (networkName: string) => {
    console.log("Attempting to connect to Stellar network:", networkName);
    console.log("STELLAR_ENABLED:", STELLAR_ENABLED);

    const network = networks.find((n) => n.name === networkName);
    if (!network || network.chain !== "stellar") {
      console.error("Invalid network:", network);
      throw new Error("Invalid Stellar network");
    }

    if (!STELLAR_ENABLED) {
      console.error("Stellar features are disabled");
      throw new Error("Stellar features are disabled");
    }

    try {
      console.log("Checking if Freighter is available...");

      // Request access to Freighter - this handles both checking if it's installed and getting permission
      console.log("Requesting Freighter access...");
      const accessResult = await requestAccess();
      console.log("Access result:", accessResult);

      if (accessResult.error) {
        throw new Error(`Freighter error: ${accessResult.error}`);
      }

      // Get the address (public key)
      console.log("Getting address...");
      const addressResult = await getAddress();
      console.log("Address result:", addressResult);

      if (addressResult.error) {
        throw new Error(`Failed to get address: ${addressResult.error}`);
      }

      const publicKey = addressResult.address;

      if (!publicKey) {
        throw new Error("Failed to get public key from Freighter wallet");
      }

      // Initialize Stellar server
      const horizonUrl = getStellarHorizonUrl(
        networkName as "stellar-mainnet" | "stellar-testnet"
      );
      const stellarServer = new StellarSdk.Horizon.Server(horizonUrl);

      try {
        // Get account balance
        const accountInfo = await stellarServer.loadAccount(publicKey);
        const nativeBalance = accountInfo.balances.find(
          (balance) => balance.asset_type === "native"
        );
        const xlmBalance = nativeBalance
          ? parseFloat(nativeBalance.balance).toFixed(7)
          : "0";

        setBalance(xlmBalance);
      } catch (error) {
        WatchTowerLogger.warn("Could not load account balance:", {
          error: error as Error,
        });
        setBalance("0");
      }

      setAccount(publicKey);
      setNetworkType("stellar");
      setServer(stellarServer);
    } catch (error) {
      console.error("Stellar connection error:", error);
      throw error;
    }
  };

  const disconnect = () => {
    setAccount(null);
    setNetworkType(null);
    setBalance(null);
    setServer(null);
  };

  const signMessage = async (message: string) => {
    if (!account || !server) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Signing message with Stellar account:", account);

      // Create a transaction with the message as memo for signing
      const sourceAccount = await server.loadAccount(account);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: getStellarNetworkPassphrase(
          networkType === "stellar" ? "stellar-testnet" : "stellar-mainnet"
        ),
      })
        .addMemo(StellarSdk.Memo.text(message.substring(0, 28))) // Stellar memo limit is 28 chars
        .addOperation(
          StellarSdk.Operation.manageData({
            name: "verify",
            value: message.substring(0, 64), // Store part of message in account data
          })
        )
        .setTimeout(0)
        .build();

      const xdr = transaction.toXDR();
      console.log("Transaction XDR:", xdr);

      // Sign the transaction using Freighter
      const signedTxResult = await signTransaction(xdr, {
        networkPassphrase: getStellarNetworkPassphrase(
          networkType === "stellar" ? "stellar-testnet" : "stellar-mainnet"
        ),
        address: account,
      });

      if (signedTxResult.error) {
        throw new Error(`Signing failed: ${signedTxResult.error}`);
      }

      console.log("Signed transaction XDR:", signedTxResult.signedTxXdr);
      return signedTxResult.signedTxXdr;
    } catch (error) {
      console.error("Message signing error:", error);
      throw error;
    }
  };

  return (
    <StellarWalletContext.Provider
      value={{
        connect,
        disconnect,
        account,
        networkType,
        signMessage,
        balance,
        server,
      }}
    >
      {children}
    </StellarWalletContext.Provider>
  );
}

export const useStellarWallet = () => useContext(StellarWalletContext);
