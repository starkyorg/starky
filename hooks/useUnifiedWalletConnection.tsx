import { useCallback, useState } from "react";
import { useWallet } from "../utils/ethereum/context/WalletConnect";
import { useStellarWallet } from "../utils/stellar/context/StellarWalletConnect";
import {
  connect as starknetConnect,
  disconnect as starknetDisconnect,
} from "starknetkit";
import networks from "../configs/networks.json";
import { ChainType, NetworkName } from "../types/networks";
import WatchTowerLogger from "../watchTower";

const useUnifiedWalletConnection = () => {
  const ethereumWallet = useWallet();
  const stellarWallet = useStellarWallet();

  const [starknetAccount, setStarknetAccount] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const connectWallet = useCallback(
    async (networkName: NetworkName) => {
      try {
        setError("");

        const network = networks.find((n) => n.name === networkName);
        if (!network) throw new Error("Network not supported");

        switch (network.chain as ChainType) {
          case "ethereum":
            await ethereumWallet.connect(networkName);
            break;
          case "stellar":
            await stellarWallet.connect(networkName);
            break;
          case "starknet":
            const { wallet } = await starknetConnect();
            if (!wallet) throw new Error("No Starknet wallet found");
            setStarknetAccount(wallet.account);
            break;
          default:
            throw new Error(`Unsupported chain type: ${network.chain}`);
        }
      } catch (err: any) {
        setError(`Failed to connect wallet: ${err.message}`);
        WatchTowerLogger.error("Wallet connection error:", err);
        throw err;
      }
    },
    [ethereumWallet, stellarWallet]
  );

  const disconnect = useCallback(async () => {
    try {
      setError("");

      if (ethereumWallet.networkType === "ethereum") {
        ethereumWallet.disconnect();
      } else if (stellarWallet.networkType === "stellar") {
        stellarWallet.disconnect();
      } else if (starknetAccount) {
        await starknetDisconnect();
        setStarknetAccount(null);
      }
    } catch (err: any) {
      setError(`Failed to disconnect wallet: ${err.message}`);
      WatchTowerLogger.error("Wallet disconnect error:", err);
    }
  }, [ethereumWallet, stellarWallet, starknetAccount]);

  const getActiveWalletInfo = () => {
    if (ethereumWallet.networkType === "ethereum" && ethereumWallet.account) {
      return {
        account: ethereumWallet.account,
        networkType: "ethereum" as ChainType,
        balance: ethereumWallet.balance,
        signMessage: ethereumWallet.signMessage,
      };
    }

    if (stellarWallet.networkType === "stellar" && stellarWallet.account) {
      return {
        account: stellarWallet.account,
        networkType: "stellar" as ChainType,
        balance: stellarWallet.balance,
        signMessage: stellarWallet.signMessage,
      };
    }

    if (starknetAccount) {
      return {
        account: starknetAccount.address,
        networkType: "starknet" as ChainType,
        balance: null,
        signMessage: async (message: string) => {
          return await starknetAccount.signMessage(JSON.parse(message));
        },
      };
    }

    return {
      account: null,
      networkType: null,
      balance: null,
      signMessage: null,
    };
  };

  return {
    connectWallet,
    disconnect,
    error,
    ...getActiveWalletInfo(),
  };
};

export default useUnifiedWalletConnection;
