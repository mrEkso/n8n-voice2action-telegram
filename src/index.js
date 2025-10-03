#!/usr/bin/env node

/**
 * Lightweight Telegram Voice Assistant
 * Main entry point
 */

import { config } from './config/index.js';
import { createBot } from './bot/index.js';
import { services } from './services/index.js';
import { initDirectories, startCleanupTask } from './utils/init.js';
import { logger } from './utils/logger.js';

/**
 * Main application function
 */
async function main() {
  if (!config.telegram.token) {
    logger.error('TELEGRAM_BOT_TOKEN not set in .env file');
    process.exit(1);
  }

  logger.info('Starting Lightweight Voice Assistant Bot...');
  logger.info(`Audio processing method: ${config.audio.processingMethod}`);
  if (config.audio.processingMethod === 'whisper') {
    logger.info(`Whisper model: ${config.whisper.model}`);
  }
  logger.info(`Resource mode: Minimal (Node.js + whisper.cpp)`);

  // Initialize directories
  await initDirectories();

  // Create and start bot
  const bot = createBot(services);

  // Start cleanup task
  await startCleanupTask();

  logger.info('Waiting for voice messages...');

  // Graceful shutdown handler
  const shutdown = () => {
    logger.info('Shutting down gracefully...');
    try {
      bot.stopPolling();
    } catch (error) {
      logger.warn(`Error while stopping polling: ${error.message}`);
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Start the application
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
