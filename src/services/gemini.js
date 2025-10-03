/**
 * Google Gemini AI Service
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import { logger } from '../utils/logger.js';

const USER_TIMEZONE = process.env.USER_TIMEZONE || 'Europe/Berlin';
const CATEGORY_COLOR_MAP = {
  home: '10',        // Basil (зелёный)
  work: '5',        // Banana (жёлтый)
  sport: '9',       // Blueberry (тёмно-синий)
  important: '11',  // Tomato (красный)
  casual: '7'       // Peacock (синий)
};

const CATEGORY_KEYWORDS = {
  home: ['дом', 'домаш', 'семь', 'дет', 'убор', 'готов', 'ремонт'],
  work: ['работ', 'meeting', 'meeting', 'job', 'офис', 'совещ', 'проек', 'коллег', 'клиент'],
  sport: ['спорт', 'тренир', 'фитнес', 'бег', 'йога', 'зал', 'плаван', 'футбол'],
  important: ['важн', 'сроч', 'дедлайн', 'deadline', 'критич', 'экзамен'],
  casual: ['еда', 'ужин', 'завтрак', 'обед', 'кафе', 'кофе', 'встреча с друзьями']
};

export class GeminiService
{
  constructor()
  {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
    {
      logger.warn('GEMINI_API_KEY not set in .env file - using fallback mode');
      this.genAI = null;
      this.model = null;
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.model = this.genAI.getGenerativeModel({
      model: this.modelName
    });

    logger.info(`Gemini service initialized with model: ${this.modelName}`);
  }

  /**
   * Analyze user intent from audio file (direct upload to Gemini)
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<Object>} - Intent analysis result
   */
  async analyzeIntentFromAudio (audioPath)
  {
    if (!this.model)
    {
      throw new Error('Gemini not configured - cannot process audio directly');
    }

    try
    {
      logger.info(`Reading audio file for Gemini upload: ${audioPath}`);
      const audioBuffer = await fs.readFile(audioPath);
      const audioBase64 = audioBuffer.toString('base64');
      const mimeType = 'audio/ogg';

      const now = new Date();
      const userLocalTime = now.toLocaleString('ru-RU', {
        timeZone: USER_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const prompt = `You are a professional voice assistant. Listen to the audio and extract structured information.

TASK: Identify the user's intent and extract key details from the voice message.

INTENT TYPES:
1. EMAIL - user wants to send an email
2. CALENDAR - user wants to create a calendar event/meeting/reminder
3. GENERAL - any other request or question

CATEGORY TYPES (choose the best match):
1. HOME - household, family, personal domestic matters
2. WORK - job, business, professional meetings or tasks
3. SPORT - workouts, training, physical activities
4. IMPORTANT - critical, urgent or high-priority matters
5. CASUAL - everyday activities like meals, leisure, miscellaneous

CALENDAR EVENT RULES (CRITICAL):
- TITLE must be 2-4 words maximum, describing ONLY the main action/topic
- TITLE must be in nominative case (именительный падеж)
- Extract precise START_TIME and END_TIME. If user specifies duration (e.g. "ещё 3 часа"), assume START_TIME is current user local time and END_TIME is START_TIME + duration.
- If user provides explicit start and duration without end time, compute END_TIME based on duration.
- If only START_TIME is known, set END_TIME to START_TIME + 1 hour.
- If only duration is mentioned, set START_TIME to the current user local time and END_TIME accordingly.
- DESCRIPTION should contain the full transcription of the voice command.
- Ignore filler words like "пожалуйста", "можешь", "сейчас", "братан" in TITLE.

RESPONSE FORMAT (use EXACTLY this structure):
INTENT: <email|calendar|general>
CATEGORY: <home|work|sport|important|casual>
RECIPIENT: <email if email intent, otherwise leave empty>
SUBJECT: <subject if email intent, otherwise leave empty>
BODY: <body if email intent, otherwise leave empty>
TITLE: <2-4 words, nominative case, NO filler words>
START_TIME: <ISO 8601 datetime, include offset if relevant>
END_TIME: <ISO 8601 datetime, include offset if relevant>
DESCRIPTION: <full transcription of voice command>
RESPONSE: <brief confirmation message>

Current UTC time: ${now.toISOString()}
Current user local time (${USER_TIMEZONE}): ${userLocalTime}

Now analyze the audio and respond:`;

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType,
            data: audioBase64
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const responseText = response.text();

      logger.info(`Gemini audio response: ${responseText.substring(0, 200)}...`);

      return this.parseResponse(responseText, '[Audio transcription]');

    } catch (error)
    {
      logger.error('Gemini audio analysis error:', error);
      logger.error('Error details:', error.message);
      throw error;
    }
  }

  /**
   * Analyze user intent from transcribed text
   * @param {string} text - Transcribed text
   * @returns {Promise<Object>} - Intent analysis result
   */
  async analyzeIntent (text)
  {
    // If no API key, use fallback
    if (!this.model)
    {
      logger.warn('Gemini not configured, using fallback detection');
      return this.fallbackIntentDetection(text);
    }

    try
    {
      const now = new Date();
      const userLocalTime = now.toLocaleString('ru-RU', {
        timeZone: USER_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const prompt = `You are a professional voice assistant. Analyze the voice command and extract structured information.

Voice command: "${text}"

TASK: Identify the user's intent and extract key details.

INTENT TYPES:
1. EMAIL - user wants to send an email
2. CALENDAR - user wants to create a calendar event/meeting/reminder
3. GENERAL - any other request or question

CATEGORY TYPES (choose the best match):
1. HOME - household, family, personal domestic matters
2. WORK - job, business, professional meetings or tasks
3. SPORT - workouts, training, physical activities
4. IMPORTANT - critical, urgent or high-priority matters
5. CASUAL - everyday activities like meals, leisure, miscellaneous

CALENDAR EVENT RULES (CRITICAL):
- TITLE must be 2-4 words maximum, describing ONLY the main action/topic
- TITLE must be in nominative case (именительный падеж)
- Extract precise START_TIME and END_TIME. If user specifies duration (e.g. "ещё 3 часа"), assume START_TIME is current user local time and END_TIME is START_TIME + duration.
- If user provides explicit start and duration without end time, compute END_TIME based on duration.
- If only START_TIME is known, set END_TIME to START_TIME + 1 hour.
- If only duration is mentioned, set START_TIME to the current user local time and END_TIME accordingly.
- DESCRIPTION should contain the full original voice command.
- Ignore filler words like "пожалуйста", "можешь", "сейчас", "братан" in TITLE.

EXAMPLES:
Input: "Создай встречу завтра в 15:00 обсудить проект с командой"
→ TITLE: Обсуждение проекта
→ START_TIME: 2025-10-04T15:00:00
→ DESCRIPTION: Создай встречу завтра в 15:00 обсудить проект с командой

Input: "Напомни позвонить маме через час"
→ TITLE: Звонок маме
→ START_TIME: 2025-10-03T04:36:00
→ DESCRIPTION: Напомни позвонить маме через час

Input: "У меня будет встреча с Вовой через час"
→ TITLE: Встреча с Вовой
→ START_TIME: 2025-10-03T04:36:00
→ DESCRIPTION: У меня будет встреча с Вовой через час

Input: "Создай событие на период один час встреча с Сашей"
→ TITLE: Встреча с Сашей
→ START_TIME: 2025-10-03T04:36:00
→ DESCRIPTION: Создай событие на период один час встреча с Сашей

RESPONSE FORMAT (use EXACTLY this structure):
INTENT: <email|calendar|general>
CATEGORY: <home|work|sport|important|casual>
RECIPIENT: <email if email intent, otherwise leave empty>
SUBJECT: <subject if email intent, otherwise leave empty>
BODY: <body if email intent, otherwise leave empty>
TITLE: <2-4 words, nominative case, NO filler words>
START_TIME: <ISO 8601 datetime, include offset if relevant>
END_TIME: <ISO 8601 datetime, include offset if relevant>
DESCRIPTION: <full original voice command>
RESPONSE: <brief confirmation message>

Current UTC time: ${now.toISOString()}
Current user local time (${USER_TIMEZONE}): ${userLocalTime}

Now analyze the command and respond:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      logger.info(`Gemini response: ${responseText.substring(0, 200)}...`);

      return this.parseResponse(responseText, text);

    } catch (error)
    {
      logger.error('Gemini analysis error:', error);
      logger.error('Error details:', error.message);
      logger.error('Stack:', error.stack);
      // Fallback to simple keyword detection
      logger.warn('Using fallback intent detection');
      return this.fallbackIntentDetection(text);
    }
  }

  /**
   * Parse Gemini response into structured data
   */
  parseResponse (responseText, originalText)
  {
    const result = {
      intent: 'general',
      category: 'casual',
      response: responseText
    };

    // Extract intent
    const intentMatch = responseText.match(/INTENT:\s*(\w+)/i);
    if (intentMatch)
    {
      result.intent = intentMatch[1].toLowerCase();
    }

    // Extract category
    const categoryMatch = responseText.match(/CATEGORY:\s*(\w+)/i);
    if (categoryMatch)
    {
      const categoryValue = categoryMatch[1].toLowerCase();
      if (CATEGORY_COLOR_MAP[categoryValue])
      {
        result.category = categoryValue;
      }
    }

    // Extract email fields
    if (result.intent === 'email')
    {
      const recipientMatch = responseText.match(/RECIPIENT:[ \t]*([^\n\r]*)/i);
      const subjectMatch = responseText.match(/SUBJECT:[ \t]*([^\n\r]*)/i);
      const bodyMatch = responseText.match(/BODY:[ \t]*([^\n\r]*)/i);

      if (recipientMatch) result.recipient = recipientMatch[1].trim();
      if (subjectMatch) result.subject = subjectMatch[1].trim();
      if (bodyMatch) result.body = bodyMatch[1].trim();
      else result.body = originalText;
    }

    // Extract calendar fields
    else if (result.intent === 'calendar')
    {
      const titleMatch = responseText.match(/TITLE:\s*([^\n]+)/i);
      const timeMatch = responseText.match(/START_TIME:\s*([^\n]+)/i);
      const endTimeMatch = responseText.match(/END_TIME:\s*([^\n]+)/i);
      const descMatch = responseText.match(/DESCRIPTION:\s*([^\n]+)/i);

      if (titleMatch) result.title = titleMatch[1].trim();
      if (timeMatch) result.startTime = timeMatch[1].trim();
      if (endTimeMatch) result.endTime = endTimeMatch[1].trim();
      if (descMatch) result.description = descMatch[1].trim();
      else result.description = originalText;

      if (!result.category || result.category === 'casual')
      {
        const detectionText = `${result.title || ''} ${result.description || ''} ${originalText || ''}`.toLowerCase();
        const fallbackCategory = this.detectCategoryFromText(detectionText);
        result.category = fallbackCategory;
      }
    }

    // Extract general response
    const responseMatch = responseText.match(/RESPONSE:\s*(.+)/is);
    if (responseMatch)
    {
      result.response = responseMatch[1].trim();
    }

    result.colorId = CATEGORY_COLOR_MAP[result.category] || CATEGORY_COLOR_MAP.casual;

    return result;
  }

  /**
   * Simple keyword-based fallback if Gemini fails
   */
  fallbackIntentDetection (text)
  {
    const textLower = text.toLowerCase();

    // Email detection
    if (/email|send|письмо|отправ/i.test(textLower))
    {
      const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      return {
        intent: 'email',
        recipient: emailMatch ? emailMatch[0] : '',
        subject: 'Voice Message',
        body: text,
        response: 'Email intent detected'
      };
    }

    // Calendar detection
    else if (/calendar|event|meeting|календарь|событие|встреч/i.test(textLower))
    {
      const fallbackCategory = this.detectCategoryFromText(textLower);
      return {
        intent: 'calendar',
        category: fallbackCategory,
        colorId: CATEGORY_COLOR_MAP[fallbackCategory],
        title: text.substring(0, 100),
        startTime: null,
        description: text,
        response: 'Calendar event intent detected'
      };
    }

    // General
    else
    {
      return {
        intent: 'general',
        category: 'casual',
        colorId: CATEGORY_COLOR_MAP.casual,
        response: `I heard: ${text}`
      };
    }
  }

  detectCategoryFromText (textLower)
  {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS))
    {
      if (keywords.some(keyword => textLower.includes(keyword)))
      {
        return category;
      }
    }
    return 'casual';
  }
}
