/**
 * Cleanup utility for temporary files
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

/**
 * Clean up old files in a directory
 * @param {string} dirPath - Directory path
 * @param {number} maxAgeHours - Maximum age in hours
 */
export async function cleanupOldFiles(dirPath, maxAgeHours = 1) {
  try {
    const files = await fs.readdir(dirPath);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      try {
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;
        
        if (age > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.debug(`Deleted old file: ${file}`);
        }
      } catch (error) {
        logger.warn(`Failed to process file ${file}:`, error.message);
      }
    }
    
    if (deletedCount > 0) {
      logger.info(`Cleanup: deleted ${deletedCount} old file(s)`);
    }
    
  } catch (error) {
    logger.error('Cleanup error:', error);
  }
}
