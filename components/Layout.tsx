import React from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import SocialLinks from "./SocialLinks";
import { useTheme } from "../hooks/useTheme";
import styles from "../styles/Layout.module.scss";

type LayoutProps = {
  children: React.ReactNode;
  showNav?: boolean;
  variant?: "default" | "hero";
};

export default function Layout({
  children,
  showNav = true,
  variant = "default",
}: LayoutProps) {
  const { theme, toggle } = useTheme();
  const isOfficial = process.env.NEXT_PUBLIC_STARKY_OFFICIAL;

  return (
    <div className={styles.layout}>
      <div className={styles.background} aria-hidden="true">
        <video
          className={styles.backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/media/realms-twilight.mp4" type="video/mp4" />
        </video>
        <div className={styles.backgroundScrim} />
      </div>
      <header className={styles.header}>
        <Link href="/" className={styles.headerBrand}>
          realms.gg
        </Link>
        <div className={styles.headerRight}>
          {showNav && isOfficial && (
            <nav className={styles.nav}>
              <Link href="/help">Help</Link>
              <Link href="/examples">Examples</Link>
            </nav>
          )}
          <button
            className={styles.themeToggle}
            onClick={toggle}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>
      <main className={variant === "hero" ? styles.heroMain : styles.main}>
        {children}
      </main>
      {isOfficial && (
        <footer className={styles.footer}>
          <SocialLinks />
        </footer>
      )}
    </div>
  );
}
