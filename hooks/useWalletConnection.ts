import { useState } from 'react';

type ChainType = 'starknet' | 'stellar';

interface NetworkConfig {
  name: string;
  url: string;
  chain: ChainType;
}

export const useWalletConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const connectStarknet = async (network: NetworkConfig) => {
    console.log(`Connecting to Starknet via ${network.url}...`);
    // Implementação da lógica de conexão Starknet (ex: using getStarknetAccount)
    // Mock de conexão:
    setIsConnected(true);
    setAddress("starknet_address_example");
  };

  const connectStellar = async (network: NetworkConfig) => {
    console.log(`Connecting to Stellar via ${network.url}...`);
    // Implementação da lógica de conexão Stellar (ex: using Freighter or Albedo)
    // Mock de conexão:
    setIsConnected(true);
    setAddress("stellar_address_example");
  };

  const connectWallet = async (network: NetworkConfig) => {
    try {
      if (network.chain === 'stellar') {
        await connectStellar(network);
      } else if (network.chain === 'starknet') {
        await connectStarknet(network);
      } else {
        throw new Error(`Unsupported chain: ${network.chain}`);
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      throw error;
    }
  };

  return { connectWallet, isConnected, address };
};
