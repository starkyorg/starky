import { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import ReactConfetti from "react-confetti";

import Logo from "../../../../components/Logo";
import SocialLinks from "../../../../components/SocialLinks";
import chainAliasByNetwork from "../../../../configs/chainAliasByNetwork.json";
import { DiscordMemberRepository, setupDb } from "../../../../db";
import { getDiscordServerInfo } from "../../../../discord/utils";
import { StarknetNetworkName } from "../../../../types/networks";
import messageToSign from "../../../../utils/starknet/message";
import { getVerificationAdapters } from "../../../../utils/starknet/wallet/adapterRegistry";
import { WalletAdapterError } from "../../../../utils/starknet/wallet/errors";
import { isCartridgeControllerEnabled } from "../../../../utils/starknet/wallet/featureFlags";
import { isExpectedStarknetNetwork } from "../../../../utils/starknet/wallet/network";
import { createVerifyFlowOrchestrator } from "../../../../utils/starknet/wallet/verifyFlowOrchestrator";
import { StarknetWalletAdapter } from "../../../../utils/starknet/wallet/types";
import WatchTowerLogger from "../../../../watchTower";
import DiscordServerInfo from "../../../../components/verification/DiscordServerInfo";
import WalletInfo from "../../../../components/verification/WalletInfo";

import styles from "../../../../styles/Verify.module.scss";

type Props = {
  discordServerName: string;
  discordServerIcon?: string | null;
  starknetNetwork: StarknetNetworkName;
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
  const [account, setAccount] = useState<any>(undefined);
  const [noStarknetWallet, setNotStarknetWallet] = useState<boolean>(false);
  const [wrongStarknetNetwork, setWrongStarknetNetwork] =
    useState<boolean>(false);
  const [verifyingSignature, setVerifyingSignature] = useState<boolean>(false);
  const [verifiedSignature, setVerifiedSignature] = useState<boolean>(false);
  const [unverifiedSignature, setUnverifiedSignature] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [isArgent, setIsArgent] = useState<boolean>(false);
  const [activeAdapter, setActiveAdapter] = useState<StarknetWalletAdapter | null>(
    null
  );
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [switchError, setSwitchError] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const cartridgeEnabled = isCartridgeControllerEnabled();
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

  const handleNetworkSwitch = useCallback(
    async (wallet: any, adapter: StarknetWalletAdapter) => {
      setIsSwitching(true);
      try {
        await wallet.request({
          type: "wallet_switchStarknetChain",
          params: { chainId: chainAliasByNetwork[starknetNetwork][1] },
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
        const refreshedConnection = await adapter.connect();
        setChainId(refreshedConnection.chainId);

        if (
          isExpectedStarknetNetwork(refreshedConnection.chainId, starknetNetwork)
        ) {
          setActiveAdapter(adapter);
          setAccount(refreshedConnection.account);
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
        WatchTowerLogger.error("Network switch failed", error);
      } finally {
        setIsSwitching(false);
      }
    },
    [starknetNetwork]
  );

  const connectWithAdapter = useCallback(
    async (adapterId: "legacy" | "cartridge") => {
      setNotStarknetWallet(false);
      setUnverifiedSignature("");

      const adapter = getVerificationAdapters(cartridgeEnabled).find(
        (candidate) => candidate.id === adapterId
      );

      if (!adapter) {
        setNotStarknetWallet(true);
        return;
      }

      try {
        const connection = await adapter.connect();
        WatchTowerLogger.info("Wallet information", {
          walletId: connection.walletId,
          address: connection.address,
          chainId: connection.chainId,
        });

        setActiveAdapter(adapter);
        setAccount(connection.account);
        setChainId(connection.chainId);

        const isArgentWallet = (connection.walletId || "")
          .toLowerCase()
          .includes("argent");
        setIsArgent(isArgentWallet);

        if (!isExpectedStarknetNetwork(connection.chainId, starknetNetwork)) {
          setWrongStarknetNetwork(true);

          if (isArgentWallet && connection.wallet?.request && adapter.id === "legacy") {
            await handleNetworkSwitch(connection.wallet, adapter);
          }
          return;
        }

        setWrongStarknetNetwork(false);
      } catch (error: any) {
        if (
          error instanceof WalletAdapterError &&
          error.code === "WALLET_UNAVAILABLE"
        ) {
          setNotStarknetWallet(true);
          return;
        }

        setUnverifiedSignature(error?.message || "wallet connection failed");
        WatchTowerLogger.error("Wallet connection failed", error);
      }
    },
    [cartridgeEnabled, handleNetworkSwitch, starknetNetwork]
  );

  const connectToStarknet = useCallback(async () => {
    await connectWithAdapter("legacy");
  }, [connectWithAdapter]);

  const connectToCartridge = useCallback(async () => {
    await connectWithAdapter("cartridge");
  }, [connectWithAdapter]);

  const sign = useCallback(async () => {
    if (!account || !activeAdapter) return;

    const resolvedDiscordServerId = Array.isArray(discordServerId)
      ? discordServerId[0]
      : discordServerId;
    const resolvedDiscordMemberId = Array.isArray(discordMemberId)
      ? discordMemberId[0]
      : discordMemberId;
    const resolvedCustomLink = Array.isArray(customLink) ? customLink[0] : customLink;

    if (!resolvedDiscordServerId || !resolvedDiscordMemberId || !resolvedCustomLink) {
      setUnverifiedSignature("verification context is incomplete, please retry");
      return;
    }

    setUnverifiedSignature("");
    setVerifyingSignature(true);

    const connectedAdapter: StarknetWalletAdapter = {
      ...activeAdapter,
      connect: async () => ({
        address: account.address.toLowerCase(),
        chainId,
        account,
      }),
    };

    const orchestrator = createVerifyFlowOrchestrator({
      adapter: connectedAdapter,
      messageTemplate: messageToSign,
      submitVerification: async (payload) => {
        await axios.post("/api/verify", payload);
      },
    });

    const result = await orchestrator.run({
      discordServerId: resolvedDiscordServerId,
      discordMemberId: resolvedDiscordMemberId,
      customLink: resolvedCustomLink,
      network: starknetNetwork,
    });

    setVerifyingSignature(false);

    if (result.status === "verified") {
      setVerifiedSignature(true);
      return;
    }

    if (result.status === "wrong_network") {
      setWrongStarknetNetwork(true);
      return;
    }

    setUnverifiedSignature(
      `${result.shortMessage}${result.advancedMessage ? `. ${result.advancedMessage}` : ""}`
    );
    WatchTowerLogger.error("Signature verification failed", result);
  }, [
    account,
    activeAdapter,
    chainId,
    customLink,
    discordMemberId,
    discordServerId,
    starknetNetwork,
  ]);

  let starknetWalletDiv = (
    <div>
      {!account && (
        <div>
          <button
            className={styles.connect}
            onClick={connectToStarknet}
            disabled={isSwitching}
          >
            {isSwitching ? "Switching Networks..." : "Connect Starknet Wallet"}
          </button>
          {cartridgeEnabled && (
            <>
              <br />
              <button
                className={styles.connect}
                onClick={connectToCartridge}
                disabled={isSwitching}
              >
                Connect Cartridge Controller
              </button>
            </>
          )}
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
            No Starknet wallet detected. We recommend using Argent Wallet for
            best experience.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.verify}>
      <Logo />
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
            setWrongStarknetNetwork(false);
            setActiveAdapter(null);
            activeAdapter
              ?.disconnect()
              .catch((error) =>
                WatchTowerLogger.error("Error during disconnect", error)
              );
          }}
        />

        <br />
        {verifiedSignature && (
          <div>
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
      {process.env.NEXT_PUBLIC_STARKY_OFFICIAL && <SocialLinks />}
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

export default VerifyPage;
