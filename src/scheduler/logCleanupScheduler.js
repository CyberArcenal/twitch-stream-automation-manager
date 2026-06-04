// Add this after the log file setup section (around line 150)
//@ts-check
// ===================== CORE IMPORTS =====================
const { app, ipcMain, screen, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const url = require("url");

// ===================== CONFIGURATION =====================
const IS_DEV = process.env.NODE_ENV === "development" || !app.isPackaged;
const APP_NAME = "Twitch Stream Manager";
const APP_VERSION = app.getVersion();
const APP_USER_DATA = app.getPath("userData");
const { logger } = require("../utils/logger");


const LOG_RETENTION_DAYS = 30; // Keep logs for 30 days

/**
 * Delete log files older than retention period
 */
async function cleanupOldLogs() {
  try {
    const logDir = path.join(APP_USER_DATA, "logs");
    const files = await fs.readdir(logDir);
    const now = Date.now();
    const maxAge = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith("twitch-") || !file.endsWith(".log")) continue;

      const filePath = path.join(logDir, file);
      const stats = await fs.stat(filePath);
      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.debug(`Deleted ${deletedCount} old log file(s)`);
    }
  } catch (err) {
    // Non‑critical error, just log
    console.warn("Log cleanup failed:", err);
  }
}

/**
 * Start log cleanup scheduler (runs once a day)
 */
function startLogCleanupScheduler() {
  // Run once on startup
  cleanupOldLogs();

  // Then every 24 hours
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
}

module.exports = {cleanupOldLogs, startLogCleanupScheduler}