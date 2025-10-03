/**
 * Preview Generators
 * Creates preview messages for email and calendar confirmations
 */

/**
 * Create email preview with confirmation buttons
 */
export function createEmailPreview(analysis, originalText, userId) {
  const emailPreview = `📧 **Email Preview**\n\n` +
    `**To:** ${analysis.recipient || '(not specified)'}\n` +
    `**Subject:** ${analysis.subject || 'Voice Message'}\n` +
    `**Body:**\n${analysis.body || originalText}\n\n` +
    `Отправить это письмо?`;

  const confirmationId = `email_${Date.now()}_${userId}`;

  return {
    preview: {
      text: emailPreview,
      options: {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Отправить', callback_data: `confirm_${confirmationId}` },
              { text: '❌ Отменить', callback_data: `cancel_${confirmationId}` }
            ],
            [
              { text: '✏️ Изменить', callback_data: `edit_${confirmationId}` }
            ]
          ]
        }
      }
    },
    confirmationData: {
      id: confirmationId,
      data: {
        type: 'email',
        data: {
          to: analysis.recipient || '',
          subject: analysis.subject || 'Voice Message',
          body: analysis.body || originalText
        },
        originalText
      }
    }
  };
}

/**
 * Create calendar event preview with confirmation buttons
 */
export function createCalendarPreview(analysis, originalText, userId) {
  const USER_TIMEZONE = process.env.USER_TIMEZONE || 'Europe/Berlin';
  const startTime = analysis.startTime ? new Date(analysis.startTime).toLocaleString('ru-RU', { timeZone: USER_TIMEZONE }) : '(не указано)';
  const endTime = analysis.endTime ? new Date(analysis.endTime).toLocaleString('ru-RU', { timeZone: USER_TIMEZONE }) : '(не указано)';
  const categoryEmoji = {
    home: '🏠',
    work: '💼',
    sport: '⚽',
    important: '🔴',
    casual: '🔵'
  }[analysis.category] || '🔵';

  const eventPreview = `📅 **Calendar Event Preview**\n\n` +
    `${categoryEmoji} **Title:** ${analysis.title || 'Voice Event'}\n` +
    `**Start:** ${startTime}\n` +
    `**End:** ${endTime}\n` +
    `**Category:** ${analysis.category || 'casual'}\n` +
    `**Description:** ${analysis.description || originalText}\n\n` +
    `Создать это событие?`;

  const confirmationId = `calendar_${Date.now()}_${userId}`;
  const baseDescription = analysis.description || originalText;
  const attribution = '\n\nСобытие создано с помощью ассистента Voice2Action.';
  const description = baseDescription.includes('Событие создано с помощью ассистента Voice2Action')
    ? baseDescription
    : `${baseDescription}${attribution}`;

  return {
    preview: {
      text: eventPreview,
      options: {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Создать', callback_data: `confirm_${confirmationId}` },
              { text: '❌ Отменить', callback_data: `cancel_${confirmationId}` }
            ],
            [
              { text: '✏️ Изменить', callback_data: `edit_${confirmationId}` }
            ]
          ]
        }
      }
    },
    confirmationData: {
      id: confirmationId,
      data: {
        type: 'calendar',
        data: {
          title: analysis.title || 'Voice Event',
          startTime: analysis.startTime,
          endTime: analysis.endTime,
          description,
          colorId: analysis.colorId
        },
        originalText
      }
    }
  };
}
