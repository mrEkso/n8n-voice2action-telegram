/**
 * Command Handlers
 * Handles /start, /status, /help commands
 */

import os from 'os';
import { config } from '../config/index.js';
import { getQueueStatus } from '../middleware/queue.js';

/**
 * Handle /start command
 */
export async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId,
    `🎙️ *Voice Assistant Ready!*\n\n` +
    `Send me a voice message and I'll:\n` +
    `• Transcribe it using Whisper.cpp\n` +
    `• Analyze your intent with AI\n` +
    `• Execute actions (email, calendar, etc.)\n\n` +
    `*Commands:*\n` +
    `/start - Show this message\n` +
    `/status - Check system status\n` +
    `/help - Get help\n\n` +
    `_Running in lightweight mode (no Docker)_`,
    { parse_mode: 'Markdown' }
  );
}

/**
 * Handle /status command
 */
export async function handleStatus(bot, msg) {
  const chatId = msg.chat.id;

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

  const cpus = os.cpus();
  const cpuModel = cpus[0].model;

  const queueStatus = getQueueStatus();

  const status =
    `📊 *System Status*\n\n` +
    `CPU: ${cpuModel}\n` +
    `Memory: ${memPercent}% (${(usedMem / 1024 / 1024 / 1024).toFixed(1)}GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(1)}GB)\n` +
    `Whisper Model: ${config.whisper.model}\n` +
    `Active Requests: ${queueStatus.active}/${queueStatus.max}\n` +
    `Mode: Lightweight (Node.js + whisper.cpp)`;

  await bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
}

/**
 * Handle /help command
 */
export async function handleHelp(bot, msg) {
  const chatId = msg.chat.id;
  const help =
    `📖 *Help*\n\n` +
    `*Voice Commands:*\n` +
    `• "Send email to [address] with subject [subject] and text [message]"\n` +
    `• "Create calendar event [title] tomorrow at 3 PM"\n` +
    `• Ask any question for AI response\n\n` +
    `*Examples:*\n` +
    `🗣 "Send email to john@example.com about meeting"\n` +
    `🗣 "Schedule team meeting tomorrow at 2 PM"\n` +
    `🗣 "What's the weather like today?"`;

  await bot.sendMessage(chatId, help, { parse_mode: 'Markdown' });
}
