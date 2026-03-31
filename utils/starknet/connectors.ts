import { ArgentMobileConnector } from "starknetkit/argentMobile";
import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";

export type StarknetModalConnector = {
  id: string;
  name: string;
  icon: {
    light?: string;
    dark?: string;
  };
  available: () => boolean;
  ready: () => Promise<boolean>;
  connect: () => Promise<{ account?: string; chainId?: bigint }>;
  disconnect: () => Promise<void>;
  account: () => Promise<any>;
  chainId: () => Promise<bigint>;
  readonly wallet: any;
  title?: string;
  subtitle?: string;
};

export const CARTRIDGE_DOCS_URL =
  "https://docs.cartridge.gg/controller/getting-started";

const isSafariBrowser = () => {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const buildStarknetConnectors = (): StarknetModalConnector[] => {
  const connectors: StarknetModalConnector[] = [];

  if (!isSafariBrowser()) {
    connectors.push(
      new InjectedConnector({
        options: { id: "argentX" },
      }) as unknown as StarknetModalConnector
    );
    connectors.push(
      new InjectedConnector({
        options: { id: "braavos" },
      }) as unknown as StarknetModalConnector
    );
  }

  connectors.push(
    new ArgentMobileConnector() as unknown as StarknetModalConnector
  );
  connectors.push(new WebWalletConnector() as unknown as StarknetModalConnector);

  return connectors;
};
