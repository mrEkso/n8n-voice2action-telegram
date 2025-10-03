/**
 * Text Message Handler
 */

import { isUserAuthorized } from '../middleware/auth.js';
import { processWithQueue } from '../middleware/queue.js';
import { setPendingConfirmation } from '../state/confirmations.js';
import { logger } from '../utils/logger.js';
import { createEmailPreview, createCalendarPreview } from '../utils/previews.js';

/**
 * Handle text messages
 */
export async function handleText(bot, msg, services) {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const text = msg.text;

  // Ignore commands
  if (text.startsWith('/')) return;

  // Check if user is allowed
  if (!isUserAuthorized(userId)) {
    await bot.sendMessage(chatId, '⛔ Unauthorized user');
    return;
  }

  await processWithQueue(async () => {
    let processingMsg = null;

    try {
      // Send processing message
      processingMsg = await bot.sendMessage(chatId, '💭 Analyzing...');

      logger.info(`Text message: ${text}`);

      // Analyze with Gemini
      const gemini = services.getGeminiService();
      const analysis = await gemini.analyzeIntent(text);

      console.log('==============================================');
      console.log(analysis);
      console.log('==============================================');

      logger.info(`Intent: ${analysis.intent}`);

      // Execute action based on intent
      if (analysis.intent === 'email') {
        const { preview, confirmationData } = createEmailPreview(analysis, text, userId);
        setPendingConfirmation(confirmationData.id, confirmationData.data);

        await bot.sendMessage(chatId, preview.text, preview.options);

      } else if (analysis.intent === 'calendar') {
        const { preview, confirmationData } = createCalendarPreview(analysis, text, userId);
        setPendingConfirmation(confirmationData.id, confirmationData.data);

        await bot.sendMessage(chatId, preview.text, preview.options);

      } else {
        // General response
        await bot.editMessageText(`💬 ${analysis.response}`, {
          chat_id: chatId,
          message_id: processingMsg.message_id
        });
        return;
      }

      // Delete processing message for email/calendar intents
      try {
        await bot.deleteMessage(chatId, processingMsg.message_id);
      } catch (e) {
        logger.warn(`Could not delete processing message: ${e.message}`);
      }

    } catch (error) {
      logger.error('Error handling text:', error);
      if (processingMsg) {
        await bot.editMessageText(`❌ Error: ${error.message}`, {
          chat_id: chatId,
          message_id: processingMsg.message_id
        });
      }
    }
  });
}
