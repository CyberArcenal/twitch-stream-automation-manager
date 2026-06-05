// services/chat/index.js
const { logger } = require("../../utils/logger");
const { ChatAuth } = require("./chat-auth");
const { ChatBadges } = require("./chat-badges");
const { ChatWhisper } = require("./chat-whisper");
const { ChatClientManager } = require("./chat-client");

class TwitchChatService {
  constructor() {
    this.auth = new ChatAuth();
    this.badges = new ChatBadges();
    this.whisper = new ChatWhisper();
    this.client = null;
    this.currentUserLogin = null;
  }

  async getAuthProvider() {
    return this.auth.getAuthProvider();
  }

  async initChatService(mainWindow) {
    this.mainWindow = mainWindow;
    this.currentUserLogin = require("../settings.service").settingsService.get("twitch")?.login || null;
    this.whisper.setCurrentUser(this.currentUserLogin);
    this.client = new ChatClientManager(this.badges);
    this.client.setCurrentUser(this.currentUserLogin);
    logger.debug(`[ChatService] Initialized, user=${this.currentUserLogin}`);
  }

  async connectToChannel(channelName) {
    const authProvider = await this.getAuthProvider();
    await this.client.connectToChannel(channelName, authProvider);
    await this.whisper.connectToWhispers(authProvider);
  }

  async disconnectChat() {
    await this.client.disconnectChat();
  }

  async sendChatMessage(message, replyParentMsgId = null) {
    return this.client.sendChatMessage(message, replyParentMsgId);
  }

  async getRecentMessages(channelName) {
    return this.client.getRecentMessages(channelName);
  }

  // Whisper methods
  async connectToWhispers() {
    const authProvider = await this.getAuthProvider();
    await this.whisper.connectToWhispers(authProvider);
  }

  async sendWhisper(userLogin, message) {
    return this.whisper.sendWhisper(userLogin, message);
  }

  async getConversations() {
    return this.whisper.getConversations();
  }

  async getMessages(userId) {
    return this.whisper.getMessages(userId);
  }

  async markConversationRead(userId) {
    return this.whisper.markConversationRead(userId);
  }

  async disconnectWhispers() {
    await this.whisper.disconnectWhispers();
  }

  // For backward compatibility
  get chatClient() {
    return this.client?.chatClient;
  }

  get currentChannel() {
    return this.client?.currentChannel;
  }
}

const twitchChatService = new TwitchChatService();
module.exports = { twitchChatService, TwitchChatService };