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
  CARTRIDGE_CONNECTOR_ID,
} from "../utils/starknet/connectors";

describe("buildStarknetConnectors", () => {
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

  it("adds Cartridge alongside the default non-Safari connectors", () => {
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
      CARTRIDGE_CONNECTOR_ID,
    ]);
    expect(mockInjectedConnector).toHaveBeenCalledTimes(2);
    expect(mockArgentMobileConnector).toHaveBeenCalledTimes(1);
    expect(mockWebWalletConnector).toHaveBeenCalledTimes(1);
  });

  it("configures Cartridge for the selected Starknet network and reads chainId from the wallet API", async () => {
    mockCartridgeConnect.mockResolvedValue({
      address: "0x123",
    });
    mockCartridgeRequest.mockResolvedValue(constants.StarknetChainId.SN_SEPOLIA);

    const connectors = buildStarknetConnectors("sepolia");
    const cartridgeConnector = connectors.find(
      (connector) => connector.id === CARTRIDGE_CONNECTOR_ID
    );

    expect(cartridgeConnector).toBeDefined();

    const connected = await cartridgeConnector!.connect();

    expect(mockCartridgeControllerConstructor).toHaveBeenCalledWith({
      lazyload: true,
      defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
    });
    expect(mockCartridgeRequest).toHaveBeenCalledWith({
      type: "wallet_requestChainId",
    });
    expect(connected).toEqual({
      account: "0x123",
      chainId: BigInt(constants.StarknetChainId.SN_SEPOLIA),
    });
  });

  it("keeps Cartridge available on Safari while omitting injected wallets", () => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { userAgent: "Version/17.0 Safari/605.1.15" },
    });

    const connectors = buildStarknetConnectors();

    expect(connectors.map((connector) => connector.id)).toEqual([
      "argentMobile",
      "argentWebWallet",
      CARTRIDGE_CONNECTOR_ID,
    ]);
    expect(mockInjectedConnector).not.toHaveBeenCalled();
  });
});
