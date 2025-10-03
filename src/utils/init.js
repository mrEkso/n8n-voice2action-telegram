/**
 * Initialization utilities
 */

import fs from 'fs/promises';
import { config } from '../config/index.js';
import { cleanupOldFiles } from './cleanup.js';
import { logger } from './logger.js';

/**
 * Create necessary directories
 */
export async function initDirectories() {
  for (const dir of Object.values(config.paths)) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Start cleanup task
 */
export async function startCleanupTask() {
  if (!config.cleanup.autoCleanup) return;

  setInterval(async () => {
    try {
      await cleanupOldFiles(config.paths.temp, config.cleanup.maxAgeHours);
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  }, 3600000); // Every hour
}
