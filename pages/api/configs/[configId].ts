import type { NextApiRequest, NextApiResponse } from "next";
import { DiscordServerConfigRepository, setupDb } from "../../../db";
import { validateToken } from "../../../utils/validateToken";
import starkyModules from "../../../starkyModules";
import { NetworkName } from "../../../types/networks";

type Data = {
  message: string;
  error?: string;
  config?: any;
};

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  await setupDb();
  const { configId } = req.query;
  const { guildId, token } = req.body;

  if (!configId || typeof configId !== "string") {
    res.status(400).json({
      message: "Invalid config ID",
      error: "Config ID is required and must be a string",
    });
    return;
  }

  if (req.method === "GET") {
    // Get config data for the form
    try {
      const config = await DiscordServerConfigRepository.findOneBy({
        id: configId,
      });

      if (!config) {
        res.status(404).json({
          message: "Config not found",
          error: "No configuration found with the provided ID",
        });
        return;
      }

      res.status(200).json({
        message: "Config retrieved successfully",
        config: {
          id: config.id,
          starknetNetwork: config.starknetNetwork,
          discordRoleId: config.discordRoleId,
          starkyModuleType: config.starkyModuleType,
          starkyModuleConfig: config.starkyModuleConfig,
        },
      });
    } catch (error) {
      console.error("Error retrieving config:", error);
      res.status(500).json({
        message: "Internal server error",
        error: "Failed to retrieve configuration",
      });
    }
  } else if (req.method === "PUT") {
    // Update config
    if (!guildId || !token) {
      res.status(400).json({
        message: "Missing required fields",
        error: "Guild ID and token are required",
      });
      return;
    }

    // Validate token
    const isValidToken = await validateToken(guildId, token);
    console.log("isValidToken", isValidToken);
    if (!isValidToken) {
      res.status(403).json({
        message: "Invalid or expired token",
        error: "Token validation failed",
      });
      return;
    }

    const {
      starknetNetwork,
      discordRoleId,
      starkyModuleType,
      starkyModuleConfig,
    } = req.body;

    if (!starknetNetwork || !discordRoleId || !starkyModuleType) {
      res.status(400).json({
        message: "Missing required fields",
        error: "Network, role ID, and module type are required",
      });
      return;
    }

    // Validate module type
    if (!starkyModules[starkyModuleType]) {
      res.status(400).json({
        message: "Invalid module type",
        error: `Module type '${starkyModuleType}' is not supported`,
      });
      return;
    }

    try {
      // Find the existing config
      const existingConfig = await DiscordServerConfigRepository.findOneBy({
        id: configId,
      });

      if (!existingConfig) {
        res.status(404).json({
          message: "Config not found",
          error: "No configuration found with the provided ID",
        });
        return;
      }

      // Verify the config belongs to the guild
      if (existingConfig.discordServerId !== guildId) {
        res.status(403).json({
          message: "Access denied",
          error: "Configuration does not belong to the specified guild",
        });
        return;
      }

      // Update the config
      existingConfig.starknetNetwork = starknetNetwork as NetworkName;
      existingConfig.discordRoleId = discordRoleId;
      existingConfig.starkyModuleType = starkyModuleType;
      existingConfig.starkyModuleConfig = starkyModuleConfig || {};

      // Save the updated config
      await DiscordServerConfigRepository.save(existingConfig);

      res.status(200).json({
        message: "Configuration updated successfully",
        config: {
          id: existingConfig.id,
          starknetNetwork: existingConfig.starknetNetwork,
          discordRoleId: existingConfig.discordRoleId,
          starkyModuleType: existingConfig.starkyModuleType,
          starkyModuleConfig: existingConfig.starkyModuleConfig,
        },
      });
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({
        message: "Internal server error",
        error: "Failed to update configuration",
      });
    }
  } else {
    res.status(405).json({
      message: "Method not allowed",
      error: `${req.method} method is not supported`,
    });
  }
};

export default handler;
