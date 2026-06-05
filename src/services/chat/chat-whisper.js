const { ChatClient } = require("@twurple/chat");
const { twitchApiService } = require("../twitch-api.service");
const { logger } = require("../../utils/logger");
const { sendToRenderers } = require("./chat-utils");

class ChatWhisper {
  constructor() {
    this.whisperClient = null;
    this.conversations = new Map();
    this.currentUserLogin = null;
    this.whisperListenersSetup = false;
  }

  setCurrentUser(login) {
    this.currentUserLogin = login;
  }

  async connectToWhispers(authProvider) {
    if (this.whisperClient) return;

    logger.info("[Whisper] Connecting...");
    try {
      this.whisperClient = new ChatClient({ authProvider, channels: [] });
      this.setupWhisperListeners();
      await this.whisperClient.connect();

      this.whisperClient.onDisconnect(async (manually) => {
        if (!manually) {
          logger.warn("[Whisper] Disconnected, reconnecting...");
          await this.connectToWhispers(authProvider);
        }
      });

      logger.success("[Whisper] Connected");
    } catch (err) {
      logger.error("[Whisper] Connection failed:", err);
    }
  }

  setupWhisperListeners() {
    if (this.whisperListenersSetup || !this.whisperClient) return;
    this.whisperListenersSetup = true;

    this.whisperClient.onWhisper((sender, message, msg) => {
      const userId = sender.id;
      const userName = sender.name;
      const userLogin = sender.name;

      const whisperMsg = {
        id: msg.id || Date.now().toString(),
        from: userName,
        to: this.currentUserLogin,
        message,
        timestamp: new Date().toISOString(),
        isFromMe: false,
        read: false,
      };

      let conv = this.conversations.get(userId);
      if (!conv) {
        conv = {
          userId,
          userLogin,
          userName,
          lastMessage: message,
          lastTimestamp: whisperMsg.timestamp,
          unreadCount: 0,
          messages: [],
        };
        this.conversations.set(userId, conv);
      }

      conv.lastMessage = message;
      conv.lastTimestamp = whisperMsg.timestamp;
      conv.unreadCount += 1;
      conv.messages.push(whisperMsg);
      if (conv.messages.length > 200) conv.messages = conv.messages.slice(-200);

      sendToRenderers("whisper:received", whisperMsg);
      sendToRenderers("whisper:conversations-updated", Array.from(this.conversations.values()));
    });

    logger.info("[Whisper] Listeners active");
  }

  async sendWhisper(userLogin, message) {
    if (!this.whisperClient) throw new Error("Whisper not connected");
    await this.whisperClient.whisper(userLogin, message);

    const user = await twitchApiService.getUserByName(userLogin);
    const userId = user?.id;
    if (userId) {
      const sentMsg = {
        id: Date.now().toString(),
        from: this.currentUserLogin,
        to: userLogin,
        message,
        timestamp: new Date().toISOString(),
        isFromMe: true,
        read: true,
      };

      let conv = this.conversations.get(userId);
      if (!conv) {
        conv = {
          userId,
          userLogin,
          userName: userLogin,
          lastMessage: message,
          lastTimestamp: sentMsg.timestamp,
          unreadCount: 0,
          messages: [],
        };
        this.conversations.set(userId, conv);
      }
      conv.lastMessage = message;
      conv.lastTimestamp = sentMsg.timestamp;
      conv.messages.push(sentMsg);

      sendToRenderers("whisper:conversations-updated", Array.from(this.conversations.values()));
      sendToRenderers("whisper:sent", sentMsg);
    }
  }

  async disconnectWhispers() {
    if (this.whisperClient) {
      await this.whisperClient.quit();
      this.whisperClient = null;
    }
    this.whisperListenersSetup = false;
  }

  getConversations() {
    return Array.from(this.conversations.values()).sort(
      (a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp)
    );
  }

  getMessages(userId) {
    return this.conversations.get(userId)?.messages || [];
  }

  markConversationRead(userId) {
    const conv = this.conversations.get(userId);
    if (conv) {
      conv.unreadCount = 0;
      conv.messages.forEach((m) => { if (!m.isFromMe) m.read = true; });
      sendToRenderers("whisper:conversations-updated", Array.from(this.conversations.values()));
    }
  }
}

module.exports = { ChatWhisper };