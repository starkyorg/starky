import { constants } from "starknet";
import { ArgentMobileConnector } from "starknetkit/argentMobile";
import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";
import { StarknetNetworkName } from "../../types/networks";

type CartridgeController = {
  account?: {
    address: string;
  };
  request?: (call: { type: string; params?: unknown }) => Promise<unknown>;
  connect: () => Promise<
    | {
        address?: string;
      }
    | undefined
  >;
  disconnect: () => Promise<void>;
  probe?: () => Promise<
    | {
        address?: string;
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

const isSafariBrowser = () => {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const cartridgeChainIdByNetwork = {
  mainnet: constants.StarknetChainId.SN_MAIN,
  sepolia: constants.StarknetChainId.SN_SEPOLIA,
} as const;

const normalizeStarknetNetwork = (
  networkName?: string
): keyof typeof cartridgeChainIdByNetwork =>
  networkName === "sepolia" ? "sepolia" : "mainnet";

const cartridgeControllers = new Map<
  keyof typeof cartridgeChainIdByNetwork,
  CartridgeController
>();
const cartridgeControllerPromises = new Map<
  keyof typeof cartridgeChainIdByNetwork,
  Promise<CartridgeController>
>();

const toChainId = (chainId?: string | number | bigint) => {
  if (typeof chainId === "bigint") return chainId;
  if (typeof chainId === "number") return BigInt(chainId);
  if (typeof chainId === "string" && chainId.length > 0) {
    return BigInt(chainId);
  }

  throw new Error("Cartridge chain ID is unavailable");
};

const getCartridgeController = async (
  networkName: keyof typeof cartridgeChainIdByNetwork
) => {
  const existingController = cartridgeControllers.get(networkName);
  if (existingController) return existingController;

  const existingPromise = cartridgeControllerPromises.get(networkName);
  if (existingPromise) return existingPromise;

  const controllerPromise = import("@cartridge/controller").then(
      ({ default: Controller }) => {
        const controller = new Controller({
          lazyload: true,
          defaultChainId: cartridgeChainIdByNetwork[networkName],
        }) as any;
        cartridgeControllers.set(networkName, controller);
        return controller as CartridgeController;
      }
    );
  cartridgeControllerPromises.set(networkName, controllerPromise);

  return controllerPromise;
};

const getCartridgeAccount = async (
  networkName: keyof typeof cartridgeChainIdByNetwork
) => {
  const controller = await getCartridgeController(networkName);
  if (controller.account) return controller.account;
  if (controller.probe) {
    const account = await controller.probe();
    if (account) return account;
  }

  throw new Error("Cartridge wallet is not connected");
};

const getCartridgeChainId = async (
  controller: CartridgeController,
  networkName: keyof typeof cartridgeChainIdByNetwork
) => {
  if (controller.request) {
    const walletChainId = await controller.request({
      type: "wallet_requestChainId",
    });

    if (
      typeof walletChainId === "string" ||
      typeof walletChainId === "number" ||
      typeof walletChainId === "bigint"
    ) {
      return toChainId(walletChainId);
    }
  }

  return toChainId(cartridgeChainIdByNetwork[networkName]);
};

const createCartridgeConnector = (
  networkName: keyof typeof cartridgeChainIdByNetwork
): StarknetModalConnector => ({
  id: CARTRIDGE_CONNECTOR_ID,
  name: "Cartridge",
  icon: { light: cartridgeIcon, dark: cartridgeIcon },
  title: "Cartridge Controller",
  subtitle: "Passkey wallet",
  available: () => typeof window !== "undefined",
  ready: async () => false,
  connect: async () => {
    const controller = await getCartridgeController(networkName);
    const account = await controller.connect();

    if (!account?.address) {
      throw new Error("Cartridge wallet connection was cancelled");
    }

    return {
      account: account.address,
      chainId: await getCartridgeChainId(controller, networkName),
    };
  },
  disconnect: async () => {
    const controller = await getCartridgeController(networkName);
    await controller.disconnect();
  },
  account: async () => (await getCartridgeAccount(networkName)) as any,
  chainId: async () => {
    const controller = await getCartridgeController(networkName);
    return getCartridgeChainId(controller, networkName);
  },
  get wallet() {
    return cartridgeControllers.get(networkName) as any;
  },
});

export const buildStarknetConnectors = (
  networkName: StarknetNetworkName | string = "mainnet"
): StarknetModalConnector[] => {
  const starknetNetwork = normalizeStarknetNetwork(networkName);
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
  connectors.push(createCartridgeConnector(starknetNetwork));

  return connectors;
};
