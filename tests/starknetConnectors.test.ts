import { constants } from "starknet";

const mockInjectedConnector = jest.fn(
  ({ options }: { options: { id: string } }) => ({
    id: options.id,
    name: options.id,
    icon: { light: "", dark: "" },
  })
);

const mockArgentMobileConnector = jest.fn(() => ({
  id: "argentMobile",
  name: "Argent Mobile",
  icon: { light: "", dark: "" },
}));

const mockWebWalletConnector = jest.fn(() => ({
  id: "argentWebWallet",
  name: "Argent Web Wallet",
  icon: { light: "", dark: "" },
}));

const mockCartridgeRequest = jest.fn();
const mockCartridgeConnect = jest.fn();
const mockCartridgeDisconnect = jest.fn();
const mockCartridgeController = {
  request: mockCartridgeRequest,
  connect: mockCartridgeConnect,
  disconnect: mockCartridgeDisconnect,
};
const mockCartridgeControllerConstructor = jest.fn(
  () => mockCartridgeController
);

jest.mock(
  "starknetkit/injected",
  () => ({
    InjectedConnector: mockInjectedConnector,
  }),
  { virtual: true }
);

jest.mock(
  "starknetkit/argentMobile",
  () => ({
    ArgentMobileConnector: mockArgentMobileConnector,
  }),
  { virtual: true }
);

jest.mock(
  "starknetkit/webwallet",
  () => ({
    WebWalletConnector: mockWebWalletConnector,
  }),
  { virtual: true }
);

jest.mock(
  "@cartridge/controller",
  () => ({
    __esModule: true,
    default: mockCartridgeControllerConstructor,
  }),
  { virtual: true }
);

import {
  buildStarknetConnectors,
} from "../utils/starknet/connectors";
import {
  connectCartridgeController,
  resolveWalletChainId,
} from "../utils/starknet/connection";

describe("starknet wallet connections", () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    mockInjectedConnector.mockClear();
    mockArgentMobileConnector.mockClear();
    mockWebWalletConnector.mockClear();
    mockCartridgeRequest.mockReset();
    mockCartridgeConnect.mockReset();
    mockCartridgeDisconnect.mockReset();
    mockCartridgeControllerConstructor.mockClear();

    if (originalNavigator) {
      Object.defineProperty(global, "navigator", {
        configurable: true,
        value: originalNavigator,
      });
      return;
    }

    // Reset the test override when Node didn't provide one.
    Reflect.deleteProperty(global, "navigator");
  });

  it("adds the default non-Safari browser wallet connectors", () => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { userAgent: "Mozilla/5.0 Chrome/123.0.0.0 Safari/537.36" },
    });

    const connectors = buildStarknetConnectors();

    expect(connectors.map((connector) => connector.id)).toEqual([
      "argentX",
      "braavos",
      "argentMobile",
      "argentWebWallet",
    ]);
    expect(mockInjectedConnector).toHaveBeenCalledTimes(2);
    expect(mockArgentMobileConnector).toHaveBeenCalledTimes(1);
    expect(mockWebWalletConnector).toHaveBeenCalledTimes(1);
  });

  it("connects Cartridge directly with the selected Starknet network", async () => {
    mockCartridgeConnect.mockResolvedValue({
      address: "0x123",
      signMessage: jest.fn(),
    });
    mockCartridgeRequest.mockResolvedValue(constants.StarknetChainId.SN_SEPOLIA);

    const connected = await connectCartridgeController("sepolia");

    expect(mockCartridgeControllerConstructor).toHaveBeenCalledWith({
      lazyload: true,
      defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
    });
    expect(mockCartridgeRequest).toHaveBeenCalledWith({
      type: "wallet_requestChainId",
    });
    expect(connected).toEqual({
      controller: mockCartridgeController,
      account: "0x123",
      walletAccount: expect.objectContaining({
        address: "0x123",
      }),
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      walletId: "cartridge",
    });
  });

  it("falls back to wallet_requestChainId when a wallet does not expose provider.chainId", async () => {
    const wallet = {
      request: jest.fn().mockResolvedValue(constants.StarknetChainId.SN_MAIN),
    };

    await expect(resolveWalletChainId(wallet)).resolves.toBe(
      constants.StarknetChainId.SN_MAIN
    );
    expect(wallet.request).toHaveBeenCalledWith({
      type: "wallet_requestChainId",
    });
  });

  it("keeps the browser-wallet list lean on Safari", () => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { userAgent: "Version/17.0 Safari/605.1.15" },
    });

    const connectors = buildStarknetConnectors();

    expect(connectors.map((connector) => connector.id)).toEqual([
      "argentMobile",
      "argentWebWallet",
    ]);
    expect(mockInjectedConnector).not.toHaveBeenCalled();
  });
});
