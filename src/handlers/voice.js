/**
 * Voice Message Handler
 */

import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import { isUserAuthorized } from '../middleware/auth.js';
import { processWithQueue } from '../middleware/queue.js';
import { setPendingConfirmation } from '../state/confirmations.js';
import { logger } from '../utils/logger.js';
import { createEmailPreview, createCalendarPreview } from '../utils/previews.js';

/**
 * Handle voice messages
 */
export async function handleVoice(bot, msg, services) {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  // Check if user is allowed
  if (!isUserAuthorized(userId)) {
    await bot.sendMessage(chatId, '⛔ Unauthorized user');
    return;
  }

  await processWithQueue(async () => {
    let processingMsg = null;
    let voicePath = null;

    try {
      // Send processing message
      processingMsg = await bot.sendMessage(chatId, '🎤 Processing voice message...');

      // Download voice file
      const fileId = msg.voice.file_id;
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${config.telegram.token}/${file.file_path}`;

      voicePath = path.join(config.paths.temp, `voice_${Date.now()}.ogg`);

      // Download file
      const response = await fetch(fileUrl);
      const buffer = await response.arrayBuffer();
      await fs.writeFile(voicePath, Buffer.from(buffer));

      logger.info(`Downloaded voice file: ${voicePath}`);

      const gemini = services.getGeminiService();
      let analysis;
      let transcribedText = '';

      // Choose processing method based on configuration
      if (config.audio.processingMethod === 'gemini') {
        // Direct audio upload to Gemini
        await bot.editMessageText('🎵 Analyzing audio with Gemini...', {
          chat_id: chatId,
          message_id: processingMsg.message_id
        });

        analysis = await gemini.analyzeIntentFromAudio(voicePath);
        logger.info(`Intent (from audio): ${analysis.intent}`);
      } else {
        // Traditional: Whisper transcription → Gemini text analysis
        await bot.editMessageText('🔊 Transcribing audio...', {
          chat_id: chatId,
          message_id: processingMsg.message_id
        });

        const whisper = services.getWhisperService();
        transcribedText = await whisper.transcribe(voicePath);

        logger.info(`Transcribed: ${transcribedText}`);

        if (!transcribedText) {
          await bot.editMessageText('❌ Could not transcribe audio', {
            chat_id: chatId,
            message_id: processingMsg.message_id
          });
          return;
        }

        // Analyze with Gemini
        await bot.editMessageText(`💭 Analyzing: "${transcribedText.substring(0, 50)}..."`, {
          chat_id: chatId,
          message_id: processingMsg.message_id
        });

        analysis = await gemini.analyzeIntent(transcribedText);
        logger.info(`Intent: ${analysis.intent}`);
      }

      // Execute action based on intent
      if (analysis.intent === 'email') {
        const { preview, confirmationData } = createEmailPreview(analysis, transcribedText, userId);
        setPendingConfirmation(confirmationData.id, confirmationData.data);

        await bot.sendMessage(chatId, preview.text, preview.options);

      } else if (analysis.intent === 'calendar') {
        const { preview, confirmationData } = createCalendarPreview(analysis, transcribedText, userId);
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
      logger.error('Error handling voice:', error);
      if (processingMsg) {
        await bot.editMessageText(`❌ Error: ${error.message}`, {
          chat_id: chatId,
          message_id: processingMsg.message_id
        });
      }
    } finally {
      // Cleanup temp file
      if (voicePath) {
        try {
          await fs.unlink(voicePath);
        } catch (e) {
          logger.warn(`Failed to delete temp file: ${e.message}`);
        }
      }
    }
  });
}
