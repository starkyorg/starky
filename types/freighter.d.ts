declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      signTransaction: (xdr: string, network?: string) => Promise<string>;
      getNetwork: () => Promise<string>;
    };
  }
}

export {};
