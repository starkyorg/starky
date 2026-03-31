import React from "react";
import Head from "next/head";
import Link from "next/link";
import CollapsibleSection from "../components/CollapsibleSection";
import styles from "../styles/Help.module.scss";
import Image from "next/image";
import github from "../components/github-icon.png";

const HelpPage = () => {
  return (
    <>
      <Head>
        <title>realms.gg: Help</title>
        <meta name="description" content="Help and documentation for realms.gg" />
      </Head>
      <div className={styles.helpPageWrapper}>
        <main className={styles.helpContainer}>
          <div className={styles.helpHeader}>
            <h1>realms.gg: wtf?</h1>
          </div>
          <p className={styles.description}>
            realms.gg token-gates your Discord channels with Starknet assets.
          </p>

          <div className={styles.helpSections}>
            <CollapsibleSection title="Summary">
              <ul className={styles.bulletList}>
                <li>
                  realms.gg is a Discord bot that lets you token-gate Discord
                  channels with Starknet assets
                </li>
                <li>
                  for now it only works with ERC-721 contracts. Ping us if you
                  need other conditions or build them yourself
                </li>
                <li>it is open source: feel free to contribute</li>
                <li>
                  we are here to help communities communicate internally. If
                  you&apos;re interested in the topic, let&apos;s talk
                  <span className={styles.sLinks}>
                    <Link href="https://t.me/+Mi34Im1Uafc1Y2Q8">
                      (telegram group)
                    </Link>
                  </span>
                </li>
              </ul>
            </CollapsibleSection>

            <CollapsibleSection title="How do I install realms.gg on my Discord server?">
              <p className={styles.underlineText}>Discord role creation </p>
              <p>
                realms.gg links a given role in your Discord server to conditions
                on the Starknet blockchain. Before setting up your realms.gg bot,
                we encourage you to create the role that you want to token-gate
                on Discord.
              </p>
              <p>
                Give super-power to this role (access to channels, feature on
                the right tab) and you can install your bot!
              </p>
              <p className={styles.underlineText}>realms.gg bot installation </p>
              <ul className={styles.bulletList}>
                <li>
                  go to
                  <span className={styles.sLinks}>
                    <Link href="https://realms.gg/">
                      {" "}
                      https://realms.gg/{" "}
                    </Link>
                  </span>
                </li>
                <li>
                  go to <span className={styles.redText}>Server settings</span>
                  &gt; <span className={styles.redText}>Roles</span> and put
                  realms.gg at the top of the list (otherwise it will not work)
                </li>
                <li>
                  type
                  <span className={styles.redText}> /realms-add-config </span>
                  in any channel (you need to be the admin of the server)
                </li>
                <li>answer the questions that the bot asks you</li>
                <li>you&apos;re done!</li>
              </ul>
              <p className={styles.underlineText}>
                Gating multiple roles on your Discord
              </p>
              <ul className={styles.bulletList}>
                <li>
                  you can create as many configurations as you want in one
                  Discord server. Type{" "}
                  <span className={styles.redText}> /realms-add-config </span>
                  as many times as needed
                </li>
                <li>
                  you can also easily delete a configuration by typing
                  <span className={styles.redText}>/realms-delete-config</span>
                  and following instructions
                </li>
              </ul>
            </CollapsibleSection>

            <CollapsibleSection title="How does my community link realms.gg to their Starknet wallet?">
              <p>
                Once the bot is installed, they type
                <span className={styles.redText}>/realms-connect</span>
                anywhere in the server and follow the instructions.
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="Is realms.gg open source?">
              <p>
                Yes. Please find our GitHub project here:
                <span className={styles.linksnotunderline}>
                  <Link href="https://github.com/nmalzieu/starky">
                    <Image
                      src={github}
                      alt="GitHub icon"
                      width={18}
                      height={18}
                    />
                    <span className={styles.githubTextSpace}>starky</span>
                  </Link>
                </span>
              </p>

              <p>Feel free to contribute to the project!</p>
              <p>
                We had a modular approach for conditions that you need to
                fulfill to get the token-gated role. For now, the condition is
                that a given user holds a NFT from a given collection in his
                wallet.
              </p>
              <p>
                You can create other conditions for your own community and even
                submit it to be integrated to the core realms.gg product.
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="Can I self-host realms.gg?">
              <p>
                Yes. We host realms.gg for teams who prefer not to host it
                themselves but you can definitely host it on your own:
                <span className={styles.linksnotunderline}>
                  <Link href="https://github.com/nmalzieu/starky">
                    <Image
                      src={github}
                      alt="GitHub icon"
                      width={18}
                      height={18}
                    />
                    <span className={styles.githubTextSpace}>starky</span>
                  </Link>
                </span>
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="Starknet Testnet or Mainnet?">
              <p>
                Both, you choose the network when you install the realms.gg bot.
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="Who is behind realms.gg?">
              <p>
                We&apos;re Noé & Pol, founders of Pxls, bullish on Starknet and
                building stuffs for the community.
              </p>
            </CollapsibleSection>
          </div>
        </main>
      </div>
    </>
  );
};

export default HelpPage;
