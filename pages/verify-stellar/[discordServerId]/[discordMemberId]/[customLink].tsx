import React, { ReactElement } from "react";
import Layout from "../../../../components/Layout";
import styles from "../../../../styles/Verify.module.scss";

// Static Stellar Verification Page
const VerifyStellar: React.FC = () => {
  return (
    <div className={styles.verifyContainer}>
      <h1>Stellar Verification</h1>
      <p>
        Welcome to the Stellar verification page!
        <br />
        This page is for verifying your Discord membership with the Stellar
        network.
      </p>
      <div className={styles.infoBox}>
        <h2>About Stellar</h2>
        <p>
          Stellar is an open-source, decentralized protocol for digital currency
          to fiat money transfers, enabling cross-border transactions between
          any currencies.
        </p>
        <a href="https://stellar.org" target="_blank" rel="noopener noreferrer">
          Learn more about Stellar
        </a>
      </div>
      <div className={styles.staticNotice}>
        <strong>Note:</strong> Wallet connection and verification are not yet
        available for Stellar. This page is for informational purposes only.
      </div>
    </div>
  );
};

(VerifyStellar as any).getLayout = (page: ReactElement) => <Layout variant="hero" showNav={false}>{page}</Layout>;

export default VerifyStellar;
