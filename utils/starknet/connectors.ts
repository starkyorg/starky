import { ArgentMobileConnector } from "starknetkit/argentMobile";
import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";

type CartridgeController = {
  account?: {
    address: string;
    provider?: {
      chainId?: string | number | bigint;
    };
  };
  connect: () => Promise<
    | {
        address?: string;
        provider?: {
          chainId?: string | number | bigint;
        };
      }
    | undefined
  >;
  disconnect: () => Promise<void>;
  probe?: () => Promise<
    | {
        address?: string;
        provider?: {
          chainId?: string | number | bigint;
        };
      }
    | undefined
  >;
};

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

export const CARTRIDGE_CONNECTOR_ID = "cartridge";
export const CARTRIDGE_DOCS_URL =
  "https://docs.cartridge.gg/controller/getting-started";

const createIconDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const cartridgeIcon = createIconDataUri(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' rx='12' fill='#111827'/><path d='M31.5 16.5c-1.8-1.5-4.2-2.3-6.8-2.3-6 0-10.7 4.3-10.7 10s4.7 10 10.7 10c2.6 0 5-.8 6.8-2.3' fill='none' stroke='#fff' stroke-width='4' stroke-linecap='round'/></svg>"
);

let cartridgeController: CartridgeController | null = null;
let cartridgeControllerPromise: Promise<CartridgeController> | null = null;

const isSafariBrowser = () => {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const toChainId = (chainId?: string | number | bigint) => {
  if (typeof chainId === "bigint") return chainId;
  if (typeof chainId === "number") return BigInt(chainId);
  if (typeof chainId === "string" && chainId.length > 0) {
    return BigInt(chainId);
  }

  throw new Error("Cartridge chain ID is unavailable");
};

const getCartridgeController = async () => {
  if (cartridgeController) return cartridgeController;
  if (!cartridgeControllerPromise) {
    cartridgeControllerPromise = import("@cartridge/controller").then(
      ({ default: Controller }) => {
        cartridgeController = new Controller({ lazyload: true }) as any;
        return cartridgeController as CartridgeController;
      }
    );
  }

  return cartridgeControllerPromise;
};

const getCartridgeAccount = async () => {
  const controller = await getCartridgeController();
  if (controller.account) return controller.account;
  if (controller.probe) {
    const account = await controller.probe();
    if (account) return account;
  }

  throw new Error("Cartridge wallet is not connected");
};

const createCartridgeConnector = (): StarknetModalConnector => ({
  id: CARTRIDGE_CONNECTOR_ID,
  name: "Cartridge",
  icon: { light: cartridgeIcon, dark: cartridgeIcon },
  title: "Cartridge Controller",
  subtitle: "Passkey wallet",
  available: () => typeof window !== "undefined",
  ready: async () => false,
  connect: async () => {
    const controller = await getCartridgeController();
    const account = await controller.connect();

    if (!account?.address) {
      throw new Error("Cartridge wallet connection was cancelled");
    }

    return {
      account: account.address,
      chainId: toChainId(account.provider?.chainId),
    };
  },
  disconnect: async () => {
    const controller = await getCartridgeController();
    await controller.disconnect();
  },
  account: async () => (await getCartridgeAccount()) as any,
  chainId: async () => {
    const account = await getCartridgeAccount();
    return toChainId(account.provider?.chainId);
  },
  get wallet() {
    return cartridgeController as any;
  },
});

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
  connectors.push(createCartridgeConnector());

  return connectors;
};
