// services/chat/chat-client.js
//@ts-check
const { ChatClient } = require("@twurple/chat");
const { logger } = require("../../utils/logger");
const createOnConnectHandler = require("./handlers/onConnect");
const createOnMessageHandler = require("./handlers/onMessage");
const createOnJoinHandler = require("./handlers/onJoin");
const createOnDisconnectHandler = require("./handlers/onDisconnect");
const createOnMessageRemoveHandler = require("./handlers/onMessageRemove");

class ChatClientManager {
  constructor(badgesModule) {
    this.chatClient = null;
    this.currentChannel = null;
    this.reconnectAttempts = 0;
    this.MAX_RECONNECT_ATTEMPTS = 5;
    this.reconnectTimer = null;
    this.badges = badgesModule;
    this.currentUserLogin = null;
    this.authProvider = null;
    this.messageBuffer = []; // store recent messages (max 200)
  }

  setCurrentUser(login) {
    this.currentUserLogin = login;
  }

async connectToChannel(channelName, authProvider) {
  if (this.chatClient) await this.disconnectChat();

  logger.info(`[ChatClient] Connecting to #${channelName}`);
  this.authProvider = authProvider;

  try {
    this.chatClient = new ChatClient({
      authProvider,
      channels: [channelName],
      webSocket: true,
      isBot: false,
      logger: { minLevel: "debug" },
    });

    const onConnect = createOnConnectHandler(this.badges);
    const onMessage = createOnMessageHandler(this.badges, this.messageBuffer, () => this.currentUserLogin);
    const onJoin = createOnJoinHandler(this);
    const onDisconnect = createOnDisconnectHandler(this);
    const onMessageRemove = createOnMessageRemoveHandler(this.messageBuffer); 

    this.chatClient.onConnect(() => onConnect(channelName));
    this.chatClient.onMessage(onMessage);
    this.chatClient.onJoin(onJoin);
    this.chatClient.onDisconnect(onDisconnect);
    this.chatClient.onMessageRemove(onMessageRemove);

    await this.chatClient.connect();
    this.currentChannel = channelName;
    logger.success(`[ChatClient] Connected to #${channelName}`);
  } catch (err) {
    logger.error(`[ChatClient] Failed to connect to ${channelName}:`, err);
    throw err;
  }
}

  handleReconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error("[ChatClient] Max reconnect attempts reached");
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    logger.info(`[ChatClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => {
      this.connectToChannel(this.currentChannel, this.authProvider).catch(err =>
        logger.error("[ChatClient] Reconnect failed:", err)
      );
    }, delay);
  }

  async sendChatMessage(message, replyParentMsgId = null) {
    if (!this.chatClient || !this.currentChannel) throw new Error("Not connected");
    await this.chatClient.say(this.currentChannel, message, { replyTo: replyParentMsgId });

    const cleanChannel = this.currentChannel.startsWith("#") ? this.currentChannel.slice(1) : this.currentChannel;
    const syntheticMessage = {
      messageId: `local-${Date.now()}`,
      channel: cleanChannel,
      user: this.currentUserLogin,
      message,
      parsedMessage: [{ type: "text", text: message }],
      badges: [],
      emotes: new Map(),
      timestamp: new Date().toISOString(),
      isFromMe: true,
      replyParentMsgId: replyParentMsgId || null,
      isDeleted: false,
      deletedReason: null,
    };
    const { sendToRenderers } = require("./chat-utils");
    sendToRenderers("chat:message", syntheticMessage);
    logger.success(`[ChatClient] Message sent: "${message}"`);
  }

  getRecentMessages(channelName) {
    const cleanChannel = channelName.startsWith("#") ? channelName.slice(1) : channelName;
    return this.messageBuffer.filter(m => m.channel === cleanChannel);
  }

  async disconnectChat() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.chatClient) {
      await this.chatClient.quit();
      this.chatClient = null;
    }
    this.currentChannel = null;
    this.reconnectAttempts = 0;
  }
}

module.exports = { ChatClientManager };