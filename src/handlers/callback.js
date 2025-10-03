/**
 * Callback Query Handler
 * Handles button presses (confirmations, cancellations, edits)
 */

import { deletePendingConfirmation, getPendingConfirmation } from '../state/confirmations.js';
import { logger } from '../utils/logger.js';

/**
 * Handle callback queries (button presses)
 */
export async function handleCallbackQuery (bot, query, services)
{
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();
    const data = query.data;
    const messageId = query.message.message_id;

    logger.info(`Callback query received: ${data}`);

    // Answer callback query immediately to prevent timeout
    try
    {
        await bot.answerCallbackQuery(query.id);
        logger.info('Callback query answered successfully');
    } catch (error)
    {
        logger.error(`Failed to answer callback query: ${error.message}`);
    }

    try
    {
        if (!data)
        {
            throw new Error('Callback query data is empty');
        }

        const separatorIndex = data.indexOf('_');
        if (separatorIndex === -1)
        {
            throw new Error(`Invalid callback data format: ${data}`);
        }

        const action = data.substring(0, separatorIndex);
        const fullConfirmationId = data.substring(separatorIndex + 1);

        logger.info(`Action: ${action}, ConfirmationId: ${fullConfirmationId}`);

        const confirmation = getPendingConfirmation(fullConfirmationId);

        logger.info(`Confirmation found: ${confirmation ? 'yes' : 'no'}`);

        if (!confirmation)
        {
            await bot.sendMessage(chatId, '⚠️ Запрос устарел. Попробуйте снова.');
            return;
        }

        if (action === 'confirm')
        {
            // Execute the action
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: chatId,
                message_id: messageId
            });

            if (confirmation.type === 'email')
            {
                await bot.editMessageText(`📧 Отправка email...`, {
                    chat_id: chatId,
                    message_id: messageId
                });

                try
                {
                    const gmail = services.getGmailService();
                    const result = await gmail.sendEmail(confirmation.data);
                    await bot.editMessageText(`✅ Email отправлен!\n\n${result}`, {
                        chat_id: chatId,
                        message_id: messageId
                    });
                } catch (error)
                {
                    await bot.editMessageText(`❌ Ошибка отправки: ${error.message}`, {
                        chat_id: chatId,
                        message_id: messageId
                    });
                }
            }
            else if (confirmation.type === 'calendar')
            {
                await bot.editMessageText(`📅 Создание события...`, {
                    chat_id: chatId,
                    message_id: messageId
                });

                try
                {
                    const calendar = services.getCalendarService();
                    const result = await calendar.createEvent(confirmation.data);
                    await bot.editMessageText(`✅ Событие создано!\n\n${result}`, {
                        chat_id: chatId,
                        message_id: messageId
                    });
                } catch (error)
                {
                    await bot.editMessageText(`❌ Ошибка создания: ${error.message}`, {
                        chat_id: chatId,
                        message_id: messageId
                    });
                }
            }
            deletePendingConfirmation(fullConfirmationId);
        }
        else if (action === 'cancel')
        {
            await bot.editMessageText(`❌ Отменено`, {
                chat_id: chatId,
                message_id: messageId
            });
            deletePendingConfirmation(fullConfirmationId);
        }
        else if (action === 'edit')
        {
            await bot.editMessageText(
                `✏️ Чтобы изменить, отправьте новую команду с исправлениями.\n\n` +
                `Оригинальная команда:\n"${confirmation.originalText}"`,
                {
                    chat_id: chatId,
                    message_id: messageId
                }
            );
            deletePendingConfirmation(fullConfirmationId);
        }
        else
        {
            await bot.sendMessage(chatId, 'Неизвестное действие');
        }
    }
    catch (error)
    {
        logger.error('Callback query error:', error);
        try
        {
            await bot.sendMessage(chatId, '❌ Ошибка обработки');
        } catch (e)
        {
            logger.error('Failed to send error message:', e);
        }
    }
}
