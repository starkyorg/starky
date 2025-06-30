import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { NextPageContext } from "next";
import { Pie } from "react-chartjs-2";
import Logo from "../../../components/Logo";
import RedirectMessage from "../../../components/RedirectMessage";
import SocialLinks from "../../../components/SocialLinks";
import Guild from "../../../components/guild/Guild";
import {
  DiscordMemberRepository,
  DiscordServerRepository,
  setupDb,
} from "../../../db";
import { getDiscordServerInfo } from "../../../discord/utils";

import styles from "../../../styles/Verify.module.scss";
import { validateToken } from "../../../utils/validateToken";

// Register chart components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale
);

interface AnalyticsPageProps {
  userStats: Record<string, number>;
  tokenExpired?: boolean;
  serverNotFound?: boolean;
  guildInfo?: {
    name: string;
    icon: string | null;
  };
}

interface AnalyticsPageContext extends NextPageContext {
  query: {
    guildId: string;
    tokenId: string;
    guildName: string;
  };
}

const AnalyticsPage = ({
  userStats,
  tokenExpired,
  serverNotFound,
  guildInfo,
}: AnalyticsPageProps) => {
  if (tokenExpired) {
    return (
      <RedirectMessage
        title="Session Expired"
        description="Your access token has expired. You'll be redirected shortly."
        redirectTo="/"
      />
    );
  }

  if (serverNotFound) {
    return (
      <RedirectMessage
        title="Server Not Found"
        description="We could not find the server associated with this link. Redirecting to the home page."
        redirectTo="/"
      />
    );
  }

  const data = {
    labels: Object.keys(userStats),
    datasets: [
      {
        data: Object.values(userStats),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };

  return (
    <div>
      <div className={styles.verify}>
        <Logo />
      </div>
      <div className={styles.serverInfo}>
        <span>Server Analytics for Guild:</span>
        <span className={styles.serverDisplay}>
          <Guild
            discordServerName={guildInfo!.name}
            discordServerIcon={guildInfo!.icon}
          />
        </span>
      </div>

      <div className={styles.sectionHeading}>
        <b>Distribution of networks among connected wallets:</b>
      </div>

      {Object.keys(userStats).length > 0 ? (
        <div className={styles.chartContainer}>
          <Pie
            data={data}
            options={{
              responsive: true,
              plugins: { legend: { position: "top" } },
            }}
          />
        </div>
      ) : (
        <p className={styles.noDataMessage}>
          No data available for the selected guild.
        </p>
      )}

      <div className={styles.sectionHeading}>
        <SocialLinks />
      </div>
    </div>
  );
};

export const getServerSideProps = async ({ query }: AnalyticsPageContext) => {
  await setupDb();
  const { guildId, tokenId } = query;

  if (!guildId || !tokenId) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const isValidToken = await validateToken(guildId, tokenId);

  if (!isValidToken) {
    return {
      props: { tokenExpired: true },
    };
  }

  const discordServer = await DiscordServerRepository.findOneBy({
    id: guildId,
  });

  if (!discordServer) {
    return {
      props: { serverNotFound: true },
    };
  }

  const guild = await getDiscordServerInfo(guildId);

  const buildDiscordIconUrl = (iconHash: string) => {
    // Animated icons start with "a_" and use .gif, static icons use .png
    const extension = iconHash.startsWith("a_") ? ".gif" : ".png";

    return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}${extension}`;
  };

  const guildInfo = {
    name: guild.name,
    icon: guild.icon ? buildDiscordIconUrl(guild.icon) : null,
  };

  const members = await DiscordMemberRepository.findBy({
    discordServerId: guildId,
  });

  const userStats: Record<string, number> = {};
  members.forEach((member) => {
    const network = member.starknetNetwork.toLowerCase();
    userStats[network] = (userStats[network] || 0) + 1;
  });

  const formattedUserStats = Object.fromEntries(
    Object.entries(userStats).map(([network, count]) => [
      network.charAt(0).toUpperCase() + network.slice(1),
      count,
    ])
  );

  return {
    props: { userStats: formattedUserStats, guildInfo },
  };
};

export default AnalyticsPage;
