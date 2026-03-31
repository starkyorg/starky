declare module "*.png" {
  const src: string;
  export default src;
}

declare module "starknetkit/argentMobile" {
  export const ArgentMobileConnector: any;
}

declare module "starknetkit/injected" {
  export const InjectedConnector: any;
}

declare module "starknetkit/webwallet" {
  export const WebWalletConnector: any;
}
