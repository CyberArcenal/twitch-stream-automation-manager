const { twitchChatService } = require("./twitch-chat.service");
const { streamManagerService } = require("./stream-manager.service");
const { twitchApiService } = require("./twitch-api.service");
const { settingsService } = require("./settings.service");
const { logger } = require("../utils/logger");
const Store = require("electron-store");

class ChatCommandsService {
  constructor() {
    this.store = new Store({ name: "chatCommands" });
    this.defaultCommands = {
      "!so": {
        action: "shoutout",
        cooldown: 30,
        enabled: true,
        userCooldowns: new Map(),
      },
      "!clip": {
        action: "clip",
        cooldown: 60,
        enabled: true,
        userCooldowns: new Map(),
      },
      "!lurk": {
        action: "lurk",
        cooldown: 10,
        enabled: true,
        userCooldowns: new Map(),
      },
      "!uptime": {
        action: "uptime",
        cooldown: 5,
        enabled: true,
        userCooldowns: new Map(),
      },
    };
    this.commands = this.loadCommands();
    this.listenerAttached = false;
  }

  loadCommands() {
    const saved = this.store.get("commands", {});
    // Merge with defaults
    const merged = { ...this.defaultCommands };
    for (const [cmd, config] of Object.entries(saved)) {
      if (merged[cmd]) {
        merged[cmd] = { ...merged[cmd], ...config, userCooldowns: new Map() };
      } else {
        merged[cmd] = { ...config, userCooldowns: new Map() };
      }
    }
    return merged;
  }

  saveCommands() {
    const toSave = {};
    for (const [cmd, config] of Object.entries(this.commands)) {
      const { userCooldowns, ...rest } = config;
      toSave[cmd] = rest;
    }
    this.store.set("commands", toSave);
  }

  addCommand(command, action, cooldown = 0) {
    if (this.commands[command]) return false;
    this.commands[command] = {
      action,
      cooldown,
      enabled: true,
      userCooldowns: new Map(),
    };
    this.saveCommands();
    return true;
  }

  removeCommand(command) {
    if (!this.commands[command]) return false;
    delete this.commands[command];
    this.saveCommands();
    return true;
  }

  setCommandEnabled(command, enabled) {
    if (this.commands[command]) {
      this.commands[command].enabled = enabled;
      this.saveCommands();
    }
  }

  attachListener() {
    if (this.listenerAttached) return;
    if (!twitchChatService?.chatClient)return;
    twitchChatService.chatClient?.onMessage(
      async (channel, user, message, msg) => {
        const lowerMsg = message.trim().toLowerCase();
        const parts = lowerMsg.split(" ");
        const command = parts[0];
        const args = parts.slice(1);

        const cmdConfig = this.commands[command];
        if (!cmdConfig || !cmdConfig.enabled) return;

        // Cooldown check
        const userId = msg.userInfo.userId;
        const lastUsed = cmdConfig.userCooldowns.get(userId) || 0;
        const now = Date.now();
        if (now - lastUsed < cmdConfig.cooldown * 1000) return;
        cmdConfig.userCooldowns.set(userId, now);
        setTimeout(
          () => cmdConfig.userCooldowns.delete(userId),
          cmdConfig.cooldown * 1000,
        );

        // Execute action
        await this.executeCommand(
          command,
          cmdConfig.action,
          channel,
          user,
          args,
        );
      },
    );
    this.listenerAttached = true;
    logger.info("[ChatCommands] Listener attached");
  }

  async executeCommand(cmd, action, channel, userName, args) {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) return;

    switch (action) {
      case "shoutout":
        if (args.length === 0) return;
        const target = args[0].replace("@", "");
        try {
          const user = await twitchApiService.getUserByName(target);
          if (!user) throw new Error("User not found");
          await streamManagerService.sendShoutout(
            broadcasterId,
            user.id,
            broadcasterId,
          );
          const response = `Shoutout to ${target}! Check them out at twitch.tv/${target}`;
          await twitchChatService.sendChatMessage(response);
        } catch (err) {
          logger.error("[ChatCommands] Shoutout failed:", err);
        }
        break;
      case "clip":
        try {
          const clip = await streamManagerService.createClip(broadcasterId);
          const response = `Clip created: ${clip.edit_url}`;
          await twitchChatService.sendChatMessage(response);
        } catch (err) {
          logger.error("[ChatCommands] Clip failed:", err);
        }
        break;
      case "lurk":
        await twitchChatService.sendChatMessage(
          `${userName} is now lurking. Keep up the great stream!`,
        );
        break;
      case "uptime":
        const streams = await twitchApiService.getStreams([broadcasterId]);
        if (streams.data && streams.data.length > 0) {
          const startedAt = new Date(streams.data[0].started_at);
          const now = new Date();
          const diff = Math.floor((now - startedAt) / 1000);
          const hours = Math.floor(diff / 3600);
          const minutes = Math.floor((diff % 3600) / 60);
          const uptimeStr = `${hours}h ${minutes}m`;
          await twitchChatService.sendChatMessage(
            `Stream has been live for ${uptimeStr}.`,
          );
        } else {
          await twitchChatService.sendChatMessage(
            `Stream is not currently live.`,
          );
        }
        break;
      default:
        logger.warn(`[ChatCommands] Unknown action: ${action}`);
    }
  }
}

const chatCommandsService = new ChatCommandsService();
module.exports = { chatCommandsService };
