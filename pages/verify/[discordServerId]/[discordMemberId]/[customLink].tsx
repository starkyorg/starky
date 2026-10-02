import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import networks from '../../../configs/networks.json';
import { useWalletConnection } from '../../../hooks/useWalletConnection';

const VerifyPage = () => {
  const router = useRouter();
  const { discordServerId, discordMemberId, customLink } = router.query;
  const { connectWallet, isConnected, address } = useWalletConnection();
  const [currentNetwork, setCurrentNetwork] = useState<any>(null);

  useEffect(() => {
    // Lógica para determinar qual rede usar baseada no customLink ou parâmetros
    // Aqui simulamos a busca da rede no networks.json
    const network = networks.find(n => n.name === 'stellar-testnet') || networks[0];
    setCurrentNetwork(network);
  }, [router.query]);

  const handleConnect = async () => {
    if (!currentNetwork) return;
    try {
      await connectWallet(currentNetwork);
    } catch (err) {
      alert("Failed to connect wallet");
    }
  };

  if (!currentNetwork) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>Verify your identity</h1>
      <p>Network: {currentNetwork.name} ({currentNetwork.chain})</p>
      
      {!isConnected ? (
        <button 
          onClick={handleConnect}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Connect {currentNetwork.chain === 'stellar' ? 'Stellar' : 'Starknet'} Wallet
        </button>
      ) : (
        <div className="text-green-500">
          Connected: {address}
        </div>
      )}
    </div>
  );
};

export default VerifyPage;
