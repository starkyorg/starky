import {
  interactionHandlers,
  slashCommandsArray,
} from "../discord/commands/index";

describe("slash command naming", () => {
  it("registers the public slash commands with the realms prefix", () => {
    expect(slashCommandsArray.map((command) => command.name)).toEqual([
      "realms-connect",
      "realms-disconnect",
      "realms-add-config",
      "realms-delete-config",
      "realms-refresh",
      "realms-view-config",
      "realms-debug-user",
      "realms-set-config-custom-api",
      "realms-help",
      "realms-list-configs",
      "realms-analytics",
      "realms-dashboard",
    ]);
  });

  it("routes chat input handlers through the same public command names", () => {
    const chatInputNames = interactionHandlers
      .filter((handler) => handler.type === "chatInput")
      .map((handler) => handler.identifier);

    expect(chatInputNames).toEqual([
      "realms-add-config",
      "realms-delete-config",
      "realms-connect",
      "realms-disconnect",
      "realms-refresh",
      "realms-view-config",
      "realms-debug-user",
      "realms-set-config-custom-api",
      "realms-help",
      "realms-list-configs",
      "realms-analytics",
      "realms-dashboard",
    ]);
  });
});
