/**
 * Simple logger utility
 */

import fs from 'fs';
import path from 'path';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.info;
const logsDir = process.env.LOGS_DIR || './logs';
const logFile = path.join(logsDir, 'assistant.log');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function formatMessage(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

function writeToFile(message) {
  try {
    fs.appendFileSync(logFile, message + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

export const logger = {
  debug(...args) {
    if (currentLevel <= LOG_LEVELS.debug) {
      const message = formatMessage('debug', ...args);
      console.log(message);
      writeToFile(message);
    }
  },
  
  info(...args) {
    if (currentLevel <= LOG_LEVELS.info) {
      const message = formatMessage('info', ...args);
      console.log(message);
      writeToFile(message);
    }
  },
  
  warn(...args) {
    if (currentLevel <= LOG_LEVELS.warn) {
      const message = formatMessage('warn', ...args);
      console.warn(message);
      writeToFile(message);
    }
  },
  
  error(...args) {
    if (currentLevel <= LOG_LEVELS.error) {
      const message = formatMessage('error', ...args);
      console.error(message);
      writeToFile(message);
    }
  }
};
