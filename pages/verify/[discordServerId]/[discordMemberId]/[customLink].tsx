import { useCallback, useState, useEffect, ReactElement } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { Signature } from "starknet";
import { connect as starknetConnect, disconnect } from "starknetkit";
import ReactConfetti from "react-confetti";

import Layout from "../../../../components/Layout";
import chainAliasByNetwork from "../../../../configs/chainAliasByNetwork.json";
import { DiscordMemberRepository, setupDb } from "../../../../db";
import { getDiscordServerInfo } from "../../../../discord/utils";
import { StarknetNetworkName } from "../../../../types/networks";
import messageToSign from "../../../../utils/starknet/message";
import WatchTowerLogger from "../../../../watchTower";
import DiscordServerInfo from "../../../../components/verification/DiscordServerInfo";
import WalletInfo from "../../../../components/verification/WalletInfo";
import {
  connectCartridgeController,
  resolveWalletChainId,
} from "../../../../utils/starknet/connection";
import {
  buildStarknetConnectors,
  CARTRIDGE_DOCS_URL,
} from "../../../../utils/starknet/connectors";

import styles from "../../../../styles/Verify.module.scss";

type Props = {
  discordServerName: string;
  discordServerIcon?: string | null;
  starknetNetwork: StarknetNetworkName;
};

type ConnectedStarknetWallet = {
  account: any;
  chainId: string;
  walletId: string;
  disconnect: () => Promise<void>;
  request?: (call: any) => Promise<any>;
};

const getSignatureErrorMessage = (
  error: string
): {
  short: string;
  advanced?: string;
} => {
  if (error.includes("Contract not found") || error.includes("UNINITIALIZED"))
    return {
      short:
        "your wallet is not yet initialized, please make a transaction (sending ETH to yourself works) to initialize it",
      advanced: error,
    };

  // Handle the specific undefined property error
  if (
    error.includes("Cannot read properties of undefined") ||
    error.includes("received empty result")
  ) {
    return {
      short:
        "your wallet signature verification failed, please try again or try using a different wallet",
      advanced:
        "The contract response was invalid. This may happen with some wallet implementations.",
    };
  }

  return {
    short: "your signature could not be verified, please try again",
    advanced: error,
  };
};

const VerifyPage = ({
  discordServerName,
  discordServerIcon,
  starknetNetwork,
}: Props) => {
  const router = useRouter();
  const { discordServerId, discordMemberId, customLink } = router.query;
  const [connectedWallet, setConnectedWallet] =
    useState<ConnectedStarknetWallet | null>(null);
  const [account, setAccount] = useState<any>(undefined);
  const [noStarknetWallet, setNotStarknetWallet] = useState<boolean>(false);
  const [wrongStarknetNetwork, setWrongStarknetNetwork] =
    useState<boolean>(false);
  const [verifyingSignature, setVerifyingSignature] = useState<boolean>(false);
  const [verifiedSignature, setVerifiedSignature] = useState<boolean>(false);
  const [unverifiedSignature, setUnverifiedSignature] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [isArgent, setIsArgent] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [switchError, setSwitchError] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [windowDimension, setWindowDimension] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  useEffect(() => {
    setWindowDimension({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  const applyConnectedWallet = useCallback(
    (walletConnection: ConnectedStarknetWallet) => {
      setConnectedWallet(walletConnection);
      setAccount(walletConnection.account);
      setChainId(walletConnection.chainId);

      const isArgentWallet = walletConnection.walletId
        .toLowerCase()
        .includes("argent");
      setIsArgent(isArgentWallet);

      const isValidChain = chainAliasByNetwork[starknetNetwork].some(
        (id) => id.toLowerCase() === walletConnection.chainId.toLowerCase()
      );
      setWrongStarknetNetwork(!isValidChain);

      return { isArgentWallet, isValidChain };
    },
    [starknetNetwork]
  );

  const handleNetworkSwitch = useCallback(
    async (walletConnection: ConnectedStarknetWallet) => {
      if (!walletConnection.request) return;

      setIsSwitching(true);
      try {
        await walletConnection.request({
          type: "wallet_switchStarknetChain",
          params: { chainId: chainAliasByNetwork[starknetNetwork][1] },
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newChainId = await resolveWalletChainId({
          request: walletConnection.request,
        });
        setChainId(newChainId);

        const isValid = chainAliasByNetwork[starknetNetwork].some(
          (id) => id.toLowerCase() === newChainId.toLowerCase()
        );

        if (isValid) {
          setWrongStarknetNetwork(false);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        } else {
          setSwitchError(true);
          setTimeout(() => setSwitchError(false), 5000);
        }
      } catch (error: any) {
        setSwitchError(true);
        setTimeout(() => setSwitchError(false), 5000);
        WatchTowerLogger.error("Network switch failed:", error);
      } finally {
        setIsSwitching(false);
      }
    },
    [starknetNetwork]
  );

  const connectToStarknet = useCallback(async () => {
    setNotStarknetWallet(false);
    const { wallet } = await starknetConnect({
      connectors: buildStarknetConnectors() as any,
    });
    if (!wallet || !wallet.account?.address) {
      setNotStarknetWallet(true);
      return;
    }

    WatchTowerLogger.info("Wallet information", wallet);
    const browserWallet: ConnectedStarknetWallet = {
      account: wallet.account,
      chainId: await resolveWalletChainId(wallet),
      walletId: wallet.id || "browser-wallet",
      disconnect: () => disconnect(),
      request: wallet.request?.bind(wallet),
    };

    const { isArgentWallet, isValidChain } = applyConnectedWallet(browserWallet);

    if (!isValidChain && isArgentWallet) {
      await handleNetworkSwitch(browserWallet);
    }
  }, [applyConnectedWallet, handleNetworkSwitch]);

  const connectToCartridge = useCallback(async () => {
    setNotStarknetWallet(false);
    try {
      const cartridgeWallet = await connectCartridgeController(starknetNetwork);
      applyConnectedWallet({
        account: cartridgeWallet.walletAccount,
        chainId: cartridgeWallet.chainId,
        walletId: cartridgeWallet.walletId,
        disconnect: () => cartridgeWallet.controller.disconnect(),
        request: cartridgeWallet.controller.request?.bind(
          cartridgeWallet.controller
        ),
      });
    } catch (error) {
      WatchTowerLogger.error("Cartridge connection failed:", error as any);
      throw error;
    }
  }, [applyConnectedWallet, starknetNetwork]);

  const verifySignature = useCallback(
    async (signature: Signature) => {
      if (!account) return;
      setUnverifiedSignature("");
      setVerifyingSignature(true);
      try {
        await axios.post("/api/verify", {
          account: account?.address,
          signature,
          discordServerId,
          discordMemberId,
          customLink,
          network: starknetNetwork,
        });
        setVerifiedSignature(true);
        setVerifyingSignature(false);
      } catch (e: any) {
        WatchTowerLogger.error(
          "Signature verification failed with data",
          e.response?.data
        );
        setVerifyingSignature(false);
        setUnverifiedSignature(`
        ${e.response?.data?.message}.
        ${e.response?.data?.error}
          `);
      }
    },
    [customLink, discordMemberId, discordServerId, account, starknetNetwork]
  );

  const sign = useCallback(async () => {
    if (!account) return;
    try {
      const messageCopy = {
        ...messageToSign,
        domain: { ...messageToSign.domain, chainId },
      };
      const signature = await account.signMessage(messageCopy);
      await verifySignature(signature);
    } catch (e: any) {
      WatchTowerLogger.error(e.message, e);
    }
  }, [account, verifySignature, chainId]);

  let starknetWalletDiv = (
    <div>
      {!account && (
        <div className={styles.connectActions}>
          <button
            className={styles.connect}
            onClick={connectToStarknet}
            disabled={isSwitching}
          >
            {isSwitching ? "Switching Networks..." : "Connect Browser Wallet"}
          </button>
          <button className={styles.connectSecondary} onClick={connectToCartridge}>
            Use Cartridge Controller
          </button>
        </div>
      )}

      {/* Network mismatch message - show for all non-Argent wallets when wrongStarknetNetwork is true  */}
      {wrongStarknetNetwork && !isArgent && (
        <div className="danger">
          <br />
          this discord server has been configured to verify identity on the{" "}
          {starknetNetwork} network.
          <br />
          please switch your browser wallet to the {starknetNetwork} network
          then connect again
        </div>
      )}

      {/* Argent-specific network switching UI */}
      {wrongStarknetNetwork && isArgent && (
        <div className="danger">
          {isSwitching ? (
            "Confirm network switch in your Argent wallet..."
          ) : (
            <>
              {switchError && "Network switch failed. Please try again."}
              {showSuccess && "Network switched successfully! Connecting..."}
            </>
          )}
        </div>
      )}

      {account &&
        !verifyingSignature &&
        !verifiedSignature &&
        !wrongStarknetNetwork && (
          <>
            <br></br>
            <button className={styles.verify} onClick={sign}>
              Sign a message to verify your identity
            </button>
          </>
        )}
      {verifyingSignature && (
        <span className={styles.sign}>verifying your signature...</span>
      )}
      {unverifiedSignature && (
        <div className="danger">
          {getSignatureErrorMessage(unverifiedSignature).short}{" "}
          <a
            href="https://t.me/+Mi34Im1Uafc1Y2Q8"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.errorLink}
          >
            Report on Telegram
          </a>
          <br />
          {getSignatureErrorMessage(unverifiedSignature).advanced && (
            <span className={styles.advancedErrorMessage}>
              advanced: {getSignatureErrorMessage(unverifiedSignature).advanced}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (noStarknetWallet) {
    starknetWalletDiv = (
      <div>
        {isArgent ? (
          <div className="danger">
            Argent wallet detected but not connected. Please retry.
          </div>
        ) : (
          <div>
            No browser Starknet wallet detected. We recommend using Argent
            Wallet or{" "}
            <a
              href={CARTRIDGE_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cartridge Controller
            </a>
            .
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.verify}>
      <div>
        <DiscordServerInfo
          discordServerName={discordServerName}
          discordServerIcon={discordServerIcon}
          network={starknetNetwork}
          networkType="starknet"
        />
        <br />

        <WalletInfo
          account={account}
          networkType="starknet"
          verifiedSignature={verifiedSignature}
          onDisconnect={() => {
            setAccount(undefined);
            setConnectedWallet(null);
            setWrongStarknetNetwork(false);
            if (connectedWallet) {
              connectedWallet.disconnect().catch(WatchTowerLogger.error);
              return;
            }
            disconnect().catch(WatchTowerLogger.error);
          }}
        />

        <br />
        {verifiedSignature && (
          <div className={styles.successState}>
            {typeof window !== "undefined" && (
              <ReactConfetti
                width={windowDimension.width}
                height={windowDimension.height}
                recycle={false}
                numberOfPieces={200}
                gravity={0.3}
              />
            )}
            <span>
              Identity: <b>verified</b>
            </span>
            <h1>YOU&apos;RE ALL SET FREN</h1>
            <span>you shall close this tab</span>
          </div>
        )}
        {!verifiedSignature && starknetWalletDiv}
      </div>
    </div>
  );
};

export async function getServerSideProps({ res, query }: any) {
  await setupDb();
  let discordServerName = null;
  let discordServerIcon = null;
  const { discordServerId, discordMemberId, customLink } = query;
  const discordMember = await DiscordMemberRepository.findOne({
    where: {
      customLink,
      discordServerId,
      discordMemberId,
    },
    relations: ["discordServer"],
  });
  if (!discordMember || discordMember.customLink !== customLink) {
    res.setHeader("location", "/");
    res.statusCode = 302;
    res.end();
    return { props: {} };
  }
  try {
    const serverInfo = await getDiscordServerInfo(`${query.discordServerId}`);
    discordServerName = serverInfo.name;
    discordServerIcon = serverInfo.icon
      ? `https://cdn.discordapp.com/icons/${query.discordServerId}/${
          serverInfo.icon
        }${serverInfo.icon.startsWith("a_") ? ".gif" : ".png"}`
      : null;
  } catch (e: any) {
    WatchTowerLogger.error(e.message, e);
  }
  return {
    props: {
      discordServerName,
      discordServerIcon,
      starknetNetwork: discordMember.starknetNetwork,
    },
  };
}

(VerifyPage as any).getLayout = (page: ReactElement) => (
  <Layout variant="hero" showNav={false}>
    {page}
  </Layout>
);

export default VerifyPage;
