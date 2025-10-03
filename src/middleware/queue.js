/**
 * Request Queue Middleware
 * Manages concurrent request processing
 */

import { config } from '../config/index.js';

let activeRequests = 0;
const requestQueue = [];

/**
 * Process function with queue management
 * @param {Function} fn - Async function to execute
 */
export async function processWithQueue(fn) {
  if (activeRequests >= config.limits.maxConcurrentRequests) {
    await new Promise(resolve => requestQueue.push(resolve));
  }

  activeRequests++;
  try {
    return await fn();
  } finally {
    activeRequests--;
    if (requestQueue.length > 0) {
      const resolve = requestQueue.shift();
      resolve();
    }
  }
}

/**
 * Get current queue status
 */
export function getQueueStatus() {
  return {
    active: activeRequests,
    queued: requestQueue.length,
    max: config.limits.maxConcurrentRequests
  };
}
