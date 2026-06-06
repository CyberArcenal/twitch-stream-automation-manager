// src/main/services/settings/migration.js
const { getStore } = require("./store");
const { logger } = require("../../utils/logger");

function migrateOldAccount() {
  const store = getStore();
  const oldTwitch = store.get("twitch");
  if (oldTwitch && oldTwitch.userId && !store.get("accounts")[oldTwitch.userId]) {
    const {
      userId,
      login,
      accessToken,
      refreshToken,
      scope,
      expiresIn,
      obtainmentTimestamp,
    } = oldTwitch;
    store.set(`accounts.${userId}`, {
      userId,
      login,
      accessToken,
      refreshToken,
      scope,
      expiresIn,
      obtainmentTimestamp,
      userData: {
        id: userId,
        login,
        display_name: login,
        profile_image_url: null,
      },
    });
    store.set("activeAccountId", userId);
    store.delete("twitch");
    logger.info("[Settings] Migrated old single account to multi-account format");
  }
}

module.exports = { migrateOldAccount };