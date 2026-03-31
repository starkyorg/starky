import Controller from "@cartridge/controller";
import { constants } from "starknet";
import { StarknetNetworkName } from "../../types/networks";

type StarknetWalletLike = {
  account?: any;
  provider?: {
    chainId?: string | number | bigint;
  };
  chainId?: string | number | bigint;
  request?: (call: any) => Promise<any>;
  id?: string;
};

type CartridgeController = {
  connect: () => Promise<any>;
  disconnect: () => Promise<void>;
  request?: (call: any) => Promise<any>;
};

export type DirectCartridgeConnection = {
  controller: CartridgeController;
  walletAccount: any;
  account: string;
  chainId: string;
  walletId: "cartridge";
};

const cartridgeChainIdByNetwork = {
  mainnet: constants.StarknetChainId.SN_MAIN,
  sepolia: constants.StarknetChainId.SN_SEPOLIA,
} as const;

const normalizeStarknetNetwork = (
  networkName?: string
): keyof typeof cartridgeChainIdByNetwork =>
  networkName === "sepolia" ? "sepolia" : "mainnet";

const normalizeChainId = (chainId?: string | number | bigint) => {
  if (typeof chainId === "string" && chainId.length > 0) return chainId;
  if (typeof chainId === "number") return `0x${chainId.toString(16)}`;
  if (typeof chainId === "bigint") return `0x${chainId.toString(16)}`;

  throw new Error("Wallet chain ID is unavailable");
};

export const resolveWalletChainId = async (wallet: StarknetWalletLike) => {
  const chainId =
    wallet.account?.provider?.chainId || wallet.provider?.chainId || wallet.chainId;

  if (chainId) return normalizeChainId(chainId);

  if (wallet.request) {
    const requestedChainId = await wallet.request({
      type: "wallet_requestChainId",
    });

    if (
      typeof requestedChainId === "string" ||
      typeof requestedChainId === "number" ||
      typeof requestedChainId === "bigint"
    ) {
      return normalizeChainId(requestedChainId);
    }
  }

  throw new Error("Wallet chain ID is unavailable");
};

export const connectCartridgeController = async (
  networkName: StarknetNetworkName
): Promise<DirectCartridgeConnection> => {
  const starknetNetwork = normalizeStarknetNetwork(networkName);
  const controller = new Controller({
    lazyload: true,
    defaultChainId: cartridgeChainIdByNetwork[starknetNetwork],
  }) as unknown as CartridgeController;
  const walletAccount = await controller.connect();

  if (!walletAccount?.address) {
    throw new Error("Cartridge wallet connection was cancelled");
  }

  const requestedChainId = controller.request
    ? await controller.request({
        type: "wallet_requestChainId",
      })
    : cartridgeChainIdByNetwork[starknetNetwork];

  return {
    controller,
    walletAccount,
    account: walletAccount.address,
    chainId: normalizeChainId(
      requestedChainId as string | number | bigint | undefined
    ),
    walletId: "cartridge",
  };
};
