import type { NextPage } from "next";
import Link from "next/link";

import styles from "../styles/Home.module.scss";

const Home: NextPage = () => {
  const installUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=268435456&scope=applications.commands%20bot`;

  return (
    <div className={styles.home}>
      <section className={styles.heroCard}>
        <p className={styles.eyebrow}>Starknet-native Discord gating</p>
        <h1>Make private Discord access feel earned, not improvised.</h1>
        <p className={styles.lede}>
          realms.gg turns roles, channels, and community perks into something
          your members unlock onchain. Less scavenger-hunt setup, more
          intentional membership.
        </p>
        {process.env.NEXT_PUBLIC_STARKY_OFFICIAL && (
          <div className={styles.actions}>
            <a className={styles.primaryAction} href={installUrl}>
              Install the Realms bot
            </a>
            <Link className={styles.secondaryAction} href="/help">
              See how it works
            </Link>
          </div>
        )}
        <div className={styles.meta}>
          <span>Mainnet + Sepolia</span>
          <span>Role automation</span>
          <span>Member analytics</span>
        </div>
      </section>

      {process.env.NEXT_PUBLIC_STARKY_OFFICIAL && (
        <aside className={styles.sidePanel}>
          <p className={styles.sideLabel}>Inside the product</p>
          <div className={styles.sideItems}>
            <div>
              <strong>Wallet connect</strong>
              <span>Argent, Braavos, Cartridge</span>
            </div>
            <div>
              <strong>Server controls</strong>
              <span>Role gates, examples, custom APIs</span>
            </div>
            <div>
              <strong>Operator view</strong>
              <span>Analytics, dashboard, refresh flows</span>
            </div>
          </div>
          <div className={styles.extraLinks}>
            <Link href="/help">Read the setup guide</Link>
            <Link href="/examples">Browse config examples</Link>
          </div>
        </aside>
      )}
    </div>
  );
};

export default Home;
