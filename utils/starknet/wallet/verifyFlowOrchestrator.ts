import chainAliasByNetwork from "../../../configs/chainAliasByNetwork.json";
import { StarknetNetworkName } from "../../../types/networks";
import { WalletAdapterError } from "./errors";
import { isExpectedStarknetNetwork } from "./network";
import { StarknetWalletAdapter, VerifyRequestInput } from "./types";

type VerifySubmitPayload = VerifyRequestInput & {
  account: string;
  signature: unknown;
};

type VerifyFlowErrorCode = "connect_failed" | "sign_failed" | "verify_api_failed";

type VerifyFlowResult =
  | { status: "verified"; address: string; chainId: string }
  | {
      status: "wrong_network";
      address: string;
      chainId: string;
      expectedNetwork: StarknetNetworkName;
    }
  | {
      status: "error";
      errorCode: VerifyFlowErrorCode;
      shortMessage: string;
      advancedMessage?: string;
    };

type VerifyFlowDeps = {
  adapter: StarknetWalletAdapter;
  messageTemplate: any;
  submitVerification: (payload: VerifySubmitPayload) => Promise<void>;
};

const mapConnectError = (error: unknown): VerifyFlowResult => {
  if (
    error instanceof WalletAdapterError &&
    (error.code === "WALLET_UNAVAILABLE" || error.code === "CONNECT_FAILED")
  ) {
    return {
      status: "error",
      errorCode: "connect_failed",
      shortMessage: "wallet connection failed, please connect and retry",
      advancedMessage: error.message,
    };
  }

  const reason =
    error && typeof error === "object" && "message" in error
      ? String((error as any).message)
      : "Wallet connection failed";

  return {
    status: "error",
    errorCode: "connect_failed",
    shortMessage: "wallet connection failed, please connect and retry",
    advancedMessage: reason,
  };
};

const mapSignError = (error: unknown): VerifyFlowResult => {
  const reason =
    error && typeof error === "object" && "message" in error
      ? String((error as any).message)
      : "Message signing failed";

  return {
    status: "error",
    errorCode: "sign_failed",
    shortMessage: "message signing failed, please retry",
    advancedMessage: reason,
  };
};

const mapVerifyApiError = (error: unknown): VerifyFlowResult => {
  const reason =
    error && typeof error === "object" && "message" in error
      ? String((error as any).message)
      : "Verification failed";

  return {
    status: "error",
    errorCode: "verify_api_failed",
    shortMessage: "verification failed, please try again",
    advancedMessage: reason,
  };
};

export const createVerifyFlowOrchestrator = ({
  adapter,
  submitVerification,
  messageTemplate,
}: VerifyFlowDeps) => ({
  run: async (request: VerifyRequestInput): Promise<VerifyFlowResult> => {
    let connection;

    try {
      connection = await adapter.connect();
    } catch (error) {
      return mapConnectError(error);
    }

    if (!isExpectedStarknetNetwork(connection.chainId, request.network)) {
      return {
        status: "wrong_network",
        address: connection.address,
        chainId: connection.chainId,
        expectedNetwork: request.network,
      };
    }

    const targetChainId = chainAliasByNetwork[request.network][1];
    const message = {
      ...messageTemplate,
      domain: {
        ...messageTemplate.domain,
        chainId: targetChainId || connection.chainId,
      },
    };

    let signature;
    try {
      signature = await adapter.signMessage(message);
    } catch (error) {
      return mapSignError(error);
    }

    try {
      await submitVerification({
        account: connection.address,
        signature,
        ...request,
      });
    } catch (error) {
      return mapVerifyApiError(error);
    }

    return {
      status: "verified",
      address: connection.address,
      chainId: connection.chainId,
    };
  },
});

export type { VerifyFlowErrorCode, VerifyFlowResult, VerifySubmitPayload };
export type { VerifyRequestInput };

