// src/main/services/chat-commands.service.js
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
    const merged = { ...this.defaultCommands };
    for (const [cmd, config] of Object.entries(saved)) {
      // I‑restore ang userCooldowns bilang bagong Map
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

  /**
   * Magdagdag ng custom command
   * @param {string} command - e.g., "!discord"
   * @param {string} response - tugon na ipapadala sa chat
   * @param {number} cooldown - cooldown sa segundo (default 0)
   */
  addCustomCommand(command, response, cooldown = 0) {
    if (this.commands[command]) return false;
    this.commands[command] = {
      action: "reply",
      response,
      cooldown,
      enabled: true,
      userCooldowns: new Map(),
    };
    this.saveCommands();
    logger.info(`[ChatCommands] Added custom command: ${command} -> "${response}"`);
    return true;
  }

  /**
   * I‑update ang isang command (maging default o custom)
   */
  updateCommand(command, updates) {
    if (!this.commands[command]) return false;
    this.commands[command] = { ...this.commands[command], ...updates, userCooldowns: new Map() };
    this.saveCommands();
    return true;
  }

  /**
   * Alisin ang isang command
   */
  removeCommand(command) {
    if (!this.commands[command]) return false;
    delete this.commands[command];
    this.saveCommands();
    return true;
  }

  /**
   * I‑enable/disable ang command
   */
  setCommandEnabled(command, enabled) {
    if (this.commands[command]) {
      this.commands[command].enabled = enabled;
      this.saveCommands();
    }
  }

  attachListener() {
    if (this.listenerAttached) return;
    if (!twitchChatService?.chatClient) return;
    twitchChatService.chatClient.onMessage(async (channel, user, message, msg) => {
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
      setTimeout(() => cmdConfig.userCooldowns.delete(userId), cmdConfig.cooldown * 1000);

      await this.executeCommand(command, cmdConfig, channel, user, args);
    });
    this.listenerAttached = true;
    logger.info("[ChatCommands] Listener attached");
  }

  async executeCommand(cmd, config, channel, userName, args) {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) return;

    switch (config.action) {
      case "reply":
        // Magpadala ng custom na tugon
        await twitchChatService.sendChatMessage(config.response);
        logger.debug(`[ChatCommands] Replied to ${cmd}: "${config.response}"`);
        break;

      case "shoutout":
        if (args.length === 0) return;
        const target = args[0].replace("@", "");
        try {
          const user = await twitchApiService.getUserByName(target);
          if (!user) throw new Error("User not found");
          await streamManagerService.sendShoutout(broadcasterId, user.id, broadcasterId);
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
        await twitchChatService.sendChatMessage(`${userName} is now lurking. Keep up the great stream!`);
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
          await twitchChatService.sendChatMessage(`Stream has been live for ${uptimeStr}.`);
        } else {
          await twitchChatService.sendChatMessage(`Stream is not currently live.`);
        }
        break;

      default:
        logger.warn(`[ChatCommands] Unknown action: ${config.action}`);
    }
  }

  getAllCommands() {
    // I‑balik ang lahat ng commands (alisin ang userCooldowns maps para sa UI)
    const result = {};
    for (const [cmd, config] of Object.entries(this.commands)) {
      const { userCooldowns, ...rest } = config;
      result[cmd] = rest;
    }
    return result;
  }
}

const chatCommandsService = new ChatCommandsService();
module.exports = { chatCommandsService, ChatCommandsService };