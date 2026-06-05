const { twitchApiService } = require("../twitch-api.service");
const { logger } = require("../../utils/logger");

class ChatBadges {
  constructor() {
    this.globalBadges = null;
    this.channelBadges = null;
  }

  async fetchBadgeSets(broadcasterId) {
    try {
      const globalResult = await twitchApiService.fetchTwitch("chat/badges/global");
      this.globalBadges = globalResult.data || [];

      const channelResult = await twitchApiService.fetchTwitch(
        `chat/badges?broadcaster_id=${broadcasterId}`
      );
      this.channelBadges = channelResult.data || [];

      logger.debug("[ChatBadges] Badge sets fetched");
    } catch (err) {
      logger.warn("[ChatBadges] Failed to fetch badge sets:", err);
    }
  }

  getBadgeImageUrl(badgeName, badgeVersion) {
    const allSets = [...(this.channelBadges || []), ...(this.globalBadges || [])];
    const set = allSets.find((s) => s.set_id === badgeName);
    if (set && set.versions) {
      const version = set.versions.find((v) => v.id === badgeVersion);
      if (version) return version.image_url_1x || version.image_url_2x;
    }
    return null;
  }

  parseBadgesFromMessage(msg) {
    let badgesArray = [];
    try {
      const raw = msg._raw;
      if (raw && typeof raw === "string") {
        const badgesMatch = raw.match(/badges=([^;]+)/);
        if (badgesMatch && badgesMatch[1]) {
          const parts = badgesMatch[1].split(",");
          for (const part of parts) {
            const [name, version] = part.split("/");
            if (name && version) badgesArray.push({ name, version });
          }
        }
      }
      if (badgesArray.length === 0 && msg.userInfo?.badges) {
        const userBadges = msg.userInfo.badges;
        if (typeof userBadges === "object") {
          badgesArray = Object.entries(userBadges).map(([name, version]) => ({ name, version }));
        }
      }
    } catch (err) {
      logger.warn("[ChatBadges] Failed to parse badges:", err);
    }
    return badgesArray;
  }
}

module.exports = { ChatBadges };