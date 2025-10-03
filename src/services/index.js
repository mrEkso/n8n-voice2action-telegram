/**
 * Services Manager
 * Lazy-loading service instances
 */

import { config } from '../config/index.js';
import { CalendarService } from './calendar.js';
import { GeminiService } from './gemini.js';
import { GmailService } from './gmail.js';
import { WhisperService } from './whisper-transformers.js';

let whisperService = null;
let geminiService = null;
let gmailService = null;
let calendarService = null;

/**
 * Get or create Whisper service instance
 */
export function getWhisperService ()
{
    if (!whisperService)
    {
        whisperService = new WhisperService(
            config.paths.models,
            config.whisper.model,
            config.whisper.language
        );
    }
    return whisperService;
}

/**
 * Get or create Gemini service instance
 */
export function getGeminiService ()
{
    if (!geminiService)
    {
        geminiService = new GeminiService();
    }
    return geminiService;
}

/**
 * Get or create Gmail service instance
 */
export function getGmailService ()
{
    if (!gmailService)
    {
        gmailService = new GmailService(config.paths.data);
    }
    return gmailService;
}

/**
 * Get or create Calendar service instance
 */
export function getCalendarService ()
{
    if (!calendarService)
    {
        calendarService = new CalendarService(config.paths.data);
    }
    return calendarService;
}

/**
 * Export all service getters as an object
 */
export const services = {
    getWhisperService,
    getGeminiService,
    getGmailService,
    getCalendarService
};
