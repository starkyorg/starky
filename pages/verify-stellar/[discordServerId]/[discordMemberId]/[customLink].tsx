import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/router";
import ReactConfetti from "react-confetti";
import Logo from "../../../../components/Logo";
import SocialLinks from "../../../../components/SocialLinks";
import { DiscordMemberRepository, setupDb } from "../../../../db";
import { getDiscordServerInfo } from "../../../../discord/utils";
import WatchTowerLogger from "../../../../watchTower";
import styles from "../../../../styles/Verify.module.scss";
import { NetworkName } from "../../../../types/networks";
import DiscordServerInfo from "../../../../components/verification/DiscordServerInfo";
import WalletInfo from "../../../../components/verification/WalletInfo";
import {
  StellarWalletProvider,
  useStellarWallet,
} from "../../../../utils/stellar/context/StellarWalletConnect";
import messageToSign from "../../../../utils/stellar/message";
import useStellarSignatureVerification from "../../../../hooks/useStellarSignatureVerification";

type Props = {
  discordServerName: string;
  discordServerIcon?: string | null;
  network: NetworkName;
};

const getSignatureErrorMessage = (
  error: string
): {
  short: string;
  advanced?: string;
} => {
  if (error.includes("wallet not connected")) {
    return {
      short: "Please connect your Freighter wallet first",
      advanced: error,
    };
  }
  return {
    short: "Signature verification failed, please try again",
    advanced: error,
  };
};

const StellarVerifyContent = ({
  discordServerName,
  discordServerIcon,
  network,
}: Props) => {
  const router = useRouter();
  const { discordServerId, discordMemberId, customLink } = router.query;
  const { account, connect, disconnect, networkType, balance, signMessage } =
    useStellarWallet();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
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

  const {
    verifyingSignature,
    verifiedSignature,
    unverifiedSignature,
    verifySignature,
  } = useStellarSignatureVerification(
    network,
    discordServerId as string,
    discordMemberId as string,
    customLink as string
  );

  const connectToStellar = useCallback(async () => {
    setIsConnecting(true);
    try {
      await connect(network);
    } catch (error: any) {
      WatchTowerLogger.error("Failed to connect to Stellar wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [connect, network]);

  const sign = useCallback(async () => {
    if (!account) return;
    try {
      const messageCopy = {
        ...messageToSign,
        domain: {
          ...messageToSign.domain,
          chainId: network,
        },
      };

      const signature = await signMessage(JSON.stringify(messageCopy.message));

      // Verify the signature using Stellar-specific verification
      await verifySignature(
        signature,
        account,
        JSON.stringify(messageCopy.message)
      );
    } catch (e: any) {
      WatchTowerLogger.error("Signing error:", e);
    }
  }, [account, signMessage, verifySignature, network]);

  let stellarWalletDiv = (
    <div>
      {!account && (
        <div>
          <button
            className={styles.connect}
            onClick={connectToStellar}
            disabled={isConnecting || verifyingSignature}
          >
            {isConnecting ? "Connecting..." : "Connect Freighter Wallet"}
          </button>
        </div>
      )}
      {account && !verifyingSignature && !verifiedSignature && (
        <button className={styles.verify} onClick={sign}>
          Sign a message to verify your identity
        </button>
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

  return (
    <div className={styles.verify}>
      <Logo />
      <div>
        <DiscordServerInfo
          discordServerName={discordServerName}
          discordServerIcon={discordServerIcon}
          network={network}
          networkType="stellar"
        />
        <br />

        <WalletInfo
          account={account}
          networkType="stellar"
          balance={balance}
          verifiedSignature={verifiedSignature}
          onDisconnect={() => {
            disconnect();
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
        {!verifiedSignature && stellarWalletDiv}
      </div>
      {process.env.NEXT_PUBLIC_STARKY_OFFICIAL && <SocialLinks />}
    </div>
  );
};

const VerifyStellarPage = (props: Props) => {
  return (
    <StellarWalletProvider>
      <StellarVerifyContent {...props} />
    </StellarWalletProvider>
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
      network: discordMember.starknetNetwork, // This might need to be updated to support Stellar networks
    },
  };
}

export default VerifyStellarPage;
