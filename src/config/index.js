/**
 * Application Configuration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    allowedUsers: process.env.TELEGRAM_ALLOWED_USERS?.split(',').filter(Boolean) || []
  },
  paths: {
    data: process.env.DATA_DIR || './data',
    temp: process.env.TEMP_DIR || './temp',
    logs: process.env.LOGS_DIR || './logs',
    models: process.env.WHISPER_MODELS_DIR || './models'
  },
  whisper: {
    model: process.env.WHISPER_MODEL || 'tiny',
    language: process.env.WHISPER_LANGUAGE || 'auto'
  },
  audio: {
    processingMethod: process.env.AUDIO_PROCESSING_METHOD || 'whisper' // 'whisper' or 'gemini'
  },
  limits: {
    maxAudioSizeMB: parseInt(process.env.MAX_AUDIO_SIZE_MB) || 20,
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 1
  },
  cleanup: {
    autoCleanup: process.env.AUTO_CLEANUP_TEMP !== 'false',
    maxAgeHours: parseInt(process.env.TEMP_FILE_MAX_AGE_HOURS) || 1
  }
};
