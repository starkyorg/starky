import { useCallback, useState } from "react";
import axios from "axios";
import WatchTowerLogger from "../watchTower";

const useStellarSignatureVerification = (
  network: string,
  discordServerId: string,
  discordMemberId: string,
  customLink: string
) => {
  const [verifyingSignature, setVerifyingSignature] = useState<boolean>(false);
  const [verifiedSignature, setVerifiedSignature] = useState<boolean>(false);
  const [unverifiedSignature, setUnverifiedSignature] = useState<string>("");

  const verifySignature = useCallback(
    async (signature: string, account: string, message: string) => {
      if (!account) return;
      setUnverifiedSignature("");
      setVerifyingSignature(true);
      try {
        await axios.post("/api/verify-stellar", {
          account,
          signature,
          discordServerId,
          discordMemberId,
          customLink,
          network,
          message,
        });
        setVerifiedSignature(true);
        setVerifyingSignature(false);
      } catch (e: any) {
        WatchTowerLogger.error(
          "Stellar signature verification failed with data",
          e.response?.data
        );
        setVerifyingSignature(false);
        setUnverifiedSignature(
          `${e.response?.data?.message || "Verification failed"}.${
            e.response?.data?.error || ""
          }` || "Stellar signature verification failed"
        );
      }
      setVerifyingSignature(false);
    },
    [network, discordServerId, discordMemberId, customLink]
  );

  return {
    verifyingSignature,
    verifiedSignature,
    unverifiedSignature,
    verifySignature,
  };
};

export default useStellarSignatureVerification;
