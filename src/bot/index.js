/**
 * Bot Initialization and Setup
 */

import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/index.js';
import { handleStart, handleStatus, handleHelp } from '../handlers/commands.js';
import { handleVoice } from '../handlers/voice.js';
import { handleText } from '../handlers/text.js';
import { handleCallbackQuery } from '../handlers/callback.js';
import { logger } from '../utils/logger.js';

/**
 * Create and configure bot instance
 * @param {Object} services - Service instances
 * @returns {TelegramBot}
 */
export function createBot(services) {
  if (!config.telegram.token) {
    throw new Error('TELEGRAM_BOT_TOKEN not set in .env file');
  }

  const bot = new TelegramBot(config.telegram.token, { polling: true });

  // Register command handlers
  bot.onText(/\/start/, (msg) => handleStart(bot, msg));
  bot.onText(/\/status/, (msg) => handleStatus(bot, msg));
  bot.onText(/\/help/, (msg) => handleHelp(bot, msg));

  // Register message handlers
  bot.on('voice', (msg) => handleVoice(bot, msg, services));
  bot.on('text', (msg) => handleText(bot, msg, services));

  // Register callback query handler
  bot.on('callback_query', (query) => handleCallbackQuery(bot, query, services));

  logger.info('✅ Bot initialized successfully!');

  return bot;
}
