/**
 * Pending Confirmations State Management
 */

const pendingConfirmations = new Map();

/**
 * Store a pending confirmation
 * @param {string} id - Confirmation ID
 * @param {Object} data - Confirmation data
 */
export function setPendingConfirmation(id, data) {
  pendingConfirmations.set(id, data);
}

/**
 * Get a pending confirmation
 * @param {string} id - Confirmation ID
 * @returns {Object|undefined}
 */
export function getPendingConfirmation(id) {
  return pendingConfirmations.get(id);
}

/**
 * Delete a pending confirmation
 * @param {string} id - Confirmation ID
 */
export function deletePendingConfirmation(id) {
  pendingConfirmations.delete(id);
}

/**
 * Clear all pending confirmations
 */
export function clearAllConfirmations() {
  pendingConfirmations.clear();
}
