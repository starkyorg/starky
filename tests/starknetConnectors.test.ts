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
    default: jest.fn(),
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
