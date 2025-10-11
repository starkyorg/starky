import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { NetworkName } from "../../types/networks";
import {
  getChainType,
  getVerifyPageForNetwork,
} from "../../utils/networkDetection";

type Props = {
  network: NetworkName;
  discordServerId: string;
  discordMemberId: string;
  customLink: string;
};

const DynamicVerificationRouter = ({
  network,
  discordServerId,
  discordMemberId,
  customLink,
}: Props) => {
  const router = useRouter();
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    const routeToCorrectPage = async () => {
      try {
        setIsRouting(true);
        const chainType = getChainType(network);

        if (!chainType) {
          console.error(`Unknown chain type for network: ${network}`);
          return;
        }

        const correctVerifyPage = getVerifyPageForNetwork(network);
        const currentPath = router.asPath;
        const targetPath = `/${correctVerifyPage}/${discordServerId}/${discordMemberId}/${customLink}`;

        // Only route if we're not already on the correct page
        if (!currentPath.includes(`/${correctVerifyPage}/`)) {
          console.log(
            `Routing from current page to ${targetPath} for ${chainType} network`
          );
          await router.replace(targetPath);
        }
      } catch (error) {
        console.error("Error during dynamic routing:", error);
      } finally {
        setIsRouting(false);
      }
    };

    if (network && discordServerId && discordMemberId && customLink) {
      routeToCorrectPage();
    }
  }, [network, discordServerId, discordMemberId, customLink, router]);

  if (isRouting) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>
          Detecting network type and routing to the appropriate wallet
          connection...
        </p>
      </div>
    );
  }

  return null;
};

export default DynamicVerificationRouter;
