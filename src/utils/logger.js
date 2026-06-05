// src/utils/logger.js
const fs = require('fs');
const path = require('path');
const { app } = require('electron'); // Only works in main process; if used in renderer, we need a different approach.
// For safety, we'll attempt to get the userData path only if app is available.
let logFilePath = null;

function getLogFilePath() {
  
  if (logFilePath) return logFilePath;
  try {
    // Try to get the app's userData path (only works in main process)
    const userData = app.getPath('userData');
    const logsDir = path.join(userData, 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    logFilePath = path.join(logsDir, 'app.log');
    return logFilePath;
  } catch (err) {
    // Fallback: create logs folder in current working directory
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    logFilePath = path.join(logsDir, 'app.log');
    return logFilePath;
  }
}

function writeToFile(level, message, meta) {
  const filePath = getLogFilePath();
  const timestamp = new Date().toISOString();
  let logLine = `[${timestamp}] [${level}] ${message}`;
  if (meta !== null && meta !== undefined) {
    let metaStr;
    if (meta instanceof Error) {
      metaStr = `${meta.stack || meta.message}`;
    } else {
      try {
        metaStr = JSON.stringify(meta);
      } catch (e) {
        metaStr = String(meta);
      }
    }
    logLine += `\n${metaStr}`;
  }
  logLine += '\n';

  // Append asynchronously
  fs.appendFile(filePath, logLine, (err) => {
    if (err) console.error('Failed to write log to file:', err);
  });
}

function formatTimestamp() {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '');
}

function formatLevel(level) {
  switch (level) {
    case "DEBUG": return "\x1b[36mDEBUG\x1b[0m";    // Cyan
    case "INFO": return "\x1b[34mINFO\x1b[0m";      // Blue
    case "SUCCESS": return "\x1b[32mSUCCESS\x1b[0m"; // Green
    case "WARN": return "\x1b[33mWARN\x1b[0m";      // Yellow
    case "ERROR": return "\x1b[31mERROR\x1b[0m";    // Red
    default: return level;
  }
}

// Simple stringify without circular ref handling for better performance
function safeStringify(obj, space = 2) {
  try {
    if (obj === undefined) return 'undefined';
    if (obj === null) return 'null';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
    
    // For errors
    if (obj instanceof Error) {
      return JSON.stringify({
        name: obj.name,
        message: obj.message,
        stack: obj.stack
      }, null, space);
    }
    
    return JSON.stringify(obj, null, space);
  } catch (err) {
    return `[Stringify error: ${err.message}]`;
  }
}

function log(level, message, meta = null) {
  const ts = formatTimestamp();
  const lvl = formatLevel(level);
  
  // Console output
  const line = `\x1b[90m${ts}\x1b[0m ${lvl} ${message}`;
  if (level === "ERROR") {
    console.error(line);
    if (meta !== null && meta !== undefined) {
      if (meta instanceof Error) {
        console.error("\x1b[90mStack:", meta.stack, "\x1b[0m");
      } else {
        const metaStr = safeStringify(meta);
        if (metaStr && metaStr !== '{}' && metaStr !== '[]') {
          console.error("\x1b[90m" + metaStr + "\x1b[0m");
        }
      }
    }
  } else {
    console.log(line);
    if (meta !== null && meta !== undefined) {
      const metaStr = safeStringify(meta);
      if (metaStr && metaStr !== '{}' && metaStr !== '[]') {
        console.log("\x1b[90m" + metaStr + "\x1b[0m");
      }
    }
  }

  // Write to file (using original level string without colors)
  // writeToFile(level, message, meta);
}

// Convenience shortcuts - now accepts meta as second parameter
const logger = {
  debug: (msg, meta = null) => log("DEBUG", msg, meta),
  info: (msg, meta = null) => log("INFO", msg, meta),
  success: (msg, meta = null) => log("SUCCESS", msg, meta),
  warn: (msg, meta = null) => log("WARN", msg, meta),
  error: (msg, meta = null) => log("ERROR", msg, meta),
  // Optional: manually set log file path
  setLogFilePath: (filePath) => { logFilePath = filePath; }
};

module.exports = { log, logger, safeStringify };