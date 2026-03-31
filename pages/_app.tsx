import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import Head from "next/head";
import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Manrope,
} from "next/font/google";
import { WalletProvider } from "../utils/ethereum/context/WalletConnect";
import Layout from "../components/Layout";

import "../styles/globals.scss";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
  weight: ["400", "500"],
});

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);

  return (
    <WalletProvider>
      <Head>
        <title>realms.gg</title>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var theme = localStorage.getItem('realms-theme');
            if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
          } catch(e) {}
        `}} />
      </Head>
      <div
        className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable}`}
      >
        {getLayout(<Component {...pageProps} />)}
      </div>
    </WalletProvider>
  );
}

export default MyApp;
