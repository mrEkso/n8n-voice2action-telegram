/**
 * Authentication Middleware
 */

import { config } from '../config/index.js';

/**
 * Check if user is authorized
 * @param {string} userId - Telegram user ID
 * @returns {boolean}
 */
export function isUserAuthorized(userId) {
  if (config.telegram.allowedUsers.length === 0) {
    return true; // No restrictions
  }
  return config.telegram.allowedUsers.includes(userId.toString());
}
