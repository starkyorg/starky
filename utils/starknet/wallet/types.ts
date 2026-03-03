import { StarknetNetworkName } from "../../../types/networks";

export type WalletAdapterId = "legacy" | "cartridge";

export type StarknetWalletAccount = {
  address: string;
  signMessage?: (message: unknown) => Promise<unknown>;
  provider?: { chainId?: string };
};

export type StarknetWallet = {
  id?: string;
  chainId?: string;
  provider?: { chainId?: string };
  account?: StarknetWalletAccount;
  request?: (payload: any) => Promise<any>;
};

export type WalletConnection = {
  address: string;
  chainId: string;
  account: StarknetWalletAccount;
  walletId?: string;
  wallet?: StarknetWallet;
};

export type StarknetWalletAdapter = {
  id: WalletAdapterId;
  connect: () => Promise<WalletConnection>;
  disconnect: () => Promise<void>;
  signMessage: (message: unknown) => Promise<unknown>;
};

export type VerifyRequestInput = {
  discordServerId: string;
  discordMemberId: string;
  customLink: string;
  network: StarknetNetworkName;
};
