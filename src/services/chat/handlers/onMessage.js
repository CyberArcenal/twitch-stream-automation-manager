// services/chat/handlers/onMessage.js
//@ts-check
const { parseChatMessage } = require("@twurple/chat");
const { settingsService } = require("../../settings");
const { autoModerationService } = require("../../auto-moderation");
const { chatHistoryService } = require("../../chat-history");
const { logger } = require("../../../utils/logger");
const { sendToRenderers } = require("../chat-utils");

module.exports = function createOnMessageHandler(
  badgesModule,
  messageBuffer,
  currentUserLoginRef,
) {
  return async function onMessage(channel, user, message, msg) {
    const twitchData = settingsService.get("twitch");
    const broadcasterId = twitchData?.userId;
    const currentUserLogin =
      typeof currentUserLoginRef === "function"
        ? currentUserLoginRef()
        : currentUserLoginRef;

    // 1. Auto-moderation
    const moderationResult = await autoModerationService.processMessage(
      channel,
      msg.userInfo.userId,
      user,
      message,
      broadcasterId,
      msg,
    );

    // 2. Parse badges (original logic)
    let badgesArray = [];
    try {
      const raw = msg._raw;
      if (raw && typeof raw === "string") {
        const badgesMatch = raw.match(/badges=([^;]+)/);
        if (badgesMatch && badgesMatch[1]) {
          const badgesStr = badgesMatch[1];
          const parts = badgesStr.split(",");
          for (const part of parts) {
            const [name, version] = part.split("/");
            if (name && version) {
              badgesArray.push({ name, version });
            }
          }
        }
      }
      if (badgesArray.length === 0 && msg.userInfo?.badges) {
        const userBadges = msg.userInfo.badges;
        if (typeof userBadges === "object") {
          badgesArray = Object.entries(userBadges).map(([name, version]) => ({
            name,
            version,
          }));
        }
      }
    } catch (err) {
      logger.warn("[Chat] Failed to parse badges:", err);
    }

    const badgesWithUrl = badgesArray.map((b) => ({
      name: b.name,
      version: b.version,
      imageUrl: badgesModule.getBadgeImageUrl(b.name, b.version),
    }));

    const isFromMe = user === currentUserLogin;

    // 3. Build base message object
    let chatMessage = {
      messageId: msg.id,
      channel: channel,
      user: user,
      message: message,
      parsedMessage: parseChatMessage(message, msg.emoteOffsets),
      badges: badgesWithUrl,
      emotes: msg.emoteOffsets,
      timestamp: new Date().toISOString(),
      isFromMe: isFromMe,
      replyParentMsgId: msg.parentMessageId || null,
      isDeleted: false,
      deletedReason: null,
    };

    // 4. Apply moderation suppression (if any)
    if (moderationResult.shouldSuppress) {
      chatMessage.isDeleted = true;
      chatMessage.deletedReason = moderationResult.reason || "Auto-moderation";
      chatMessage.message = `[Message removed: ${chatMessage.deletedReason}]`;
      chatMessage.parsedMessage = [{ type: "text", text: chatMessage.message }];
      chatMessage.badges = [];
    }

    // 5. Apply UI filters (only if not already deleted)
    const filters = settingsService.get("chatFilters") || [];
    const isFiltered = filters.some((f) => message.toLowerCase().includes(f));
    if (isFiltered && !chatMessage.isDeleted) {
      chatMessage.isDeleted = true;
      chatMessage.deletedReason = "Filtered by chat filter";
      chatMessage.message = `[Message filtered: ${chatMessage.deletedReason}]`;
      chatMessage.parsedMessage = [{ type: "text", text: chatMessage.message }];
      chatMessage.badges = [];
    }

    // 6. Store in buffer (original messageBuffer logic)
    if (messageBuffer) {
      messageBuffer.push(chatMessage);
      if (messageBuffer.length > 200) messageBuffer.shift();
    }

    // 7. Send to renderers and history
    sendToRenderers("chat:message", chatMessage);
    chatHistoryService.addMessage(
      channel,
      user,
      chatMessage.message,
      msg.id,
      badgesArray,
    );
  };
};
