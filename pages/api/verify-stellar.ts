import type { NextApiRequest, NextApiResponse } from "next";
import { verifySignature } from "../../utils/stellar/verifySignature";
import { DiscordMemberRepository, setupDb } from "../../db";
import { refreshDiscordMemberForAllConfigs } from "../../utils/discord/refreshRoles";
import messageToSign from "../../utils/stellar/message";

type Data = {
  message: string;
  error?: string;
};

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  await setupDb();

  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
      error: "POST method required",
    });
  }

  const body = req.body;
  if (
    !body.account ||
    !body.signature ||
    !body.discordServerId ||
    !body.discordMemberId ||
    !body.customLink ||
    !body.network
  ) {
    return res.status(400).json({
      message: "Incorrect body",
      error: `Missing required fields`,
    });
  }

  const discordMember = await DiscordMemberRepository.findOne({
    where: {
      discordServerId: body.discordServerId,
      discordMemberId: body.discordMemberId,
      starknetNetwork: body.network, // This field might need to be renamed to support multiple chains
    },
    relations: ["discordServer"],
  });

  if (!discordMember || discordMember.customLink !== body.customLink) {
    return res.status(400).json({
      message: "Incorrect body",
      error: `Discord member not found or custom link is incorrect`,
    });
  }

  const message = {
    ...messageToSign,
    domain: {
      ...messageToSign.domain,
      chainId: body.network, // Use the network name as chainId for Stellar
    },
  };

  const { signatureValid, error } = await verifySignature(
    body.account,
    JSON.stringify(message.message),
    body.signature,
    body.network
  );

  if (!signatureValid) {
    return res.status(400).json({ message: "Signature is invalid", error });
  }

  // Store the Stellar address in the same field for now
  // In production, you might want to add a separate field for Stellar addresses
  discordMember.starknetWalletAddress = body.account;
  await DiscordMemberRepository.save(discordMember);

  // Refresh roles
  await refreshDiscordMemberForAllConfigs(discordMember);

  return res.status(200).json({ message: "Successfully verified" });
};

export default handler;