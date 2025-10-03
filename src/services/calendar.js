/**
 * Google Calendar Service
 * Create and manage calendar events
 */

import fs from 'fs/promises';
import { google } from 'googleapis';
import path from 'path';
import { logger } from '../utils/logger.js';

const USER_TIMEZONE = process.env.USER_TIMEZONE || 'Europe/Berlin';

export class CalendarService
{
  constructor(dataDir)
  {
    this.dataDir = dataDir;
    this.credentialsPath = path.join(dataDir, 'google_credentials.json');
    this.tokenPath = path.join(dataDir, 'google_token.json');
    this.calendar = null;
  }

  /**
   * Initialize Calendar API client
   */
  async initialize ()
  {
    if (this.calendar) return;

    try
    {
      const credentials = await this.loadCredentials();
      const auth = await this.authorize(credentials);
      this.calendar = google.calendar({ version: 'v3', auth });
      logger.info('Calendar service initialized');
    } catch (error)
    {
      logger.error('Calendar initialization error:', error);
      throw new Error('Calendar not configured. Please set up OAuth credentials.');
    }
  }

  /**
   * Load OAuth credentials
   */
  async loadCredentials ()
  {
    try
    {
      const content = await fs.readFile(this.credentialsPath, 'utf-8');
      return JSON.parse(content);
    } catch (error)
    {
      const credentials = {
        installed: {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uris: ['http://localhost:3000']
        }
      };

      await fs.writeFile(this.credentialsPath, JSON.stringify(credentials, null, 2));
      return credentials;
    }
  }

  /**
   * Authorize with OAuth
   */
  async authorize (credentials)
  {
    const { client_id, client_secret, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    try
    {
      const token = await fs.readFile(this.tokenPath, 'utf-8');
      oAuth2Client.setCredentials(JSON.parse(token));
      return oAuth2Client;
    } catch (error)
    {
      throw new Error('OAuth token not found. Please run OAuth setup first.');
    }
  }

  /**
   * Create calendar event
   * @param {Object} options - Event options
   * @param {string} options.title - Event title
   * @param {string} options.startTime - Start time (ISO string or parseable date)
   * @param {string} [options.endTime] - End time (ISO string or parseable date)
   * @param {string} options.description - Event description
   * @returns {Promise<string>} - Result message
   */
  async createEvent ({ title, startTime, endTime, description, colorId })
  {
    await this.initialize();

    if (!title)
    {
      throw new Error('Event title is required');
    }

    try
    {
      // Parse start time or use current time
      let start = startTime ? new Date(startTime) : new Date();
      if (isNaN(start.getTime()))
      {
        logger.warn(`Invalid startTime received: ${startTime}`);
        start = new Date();
      }

      let end = endTime ? new Date(endTime) : new Date(start.getTime() + 3600000);
      if (isNaN(end.getTime()))
      {
        logger.warn(`Invalid endTime received: ${endTime}`);
        end = new Date(start.getTime() + 3600000);
      }

      if (end <= start)
      {
        logger.warn(`End time ${end.toISOString()} is not after start time ${start.toISOString()}, adjusting.`);
        end = new Date(start.getTime() + 3600000);
      }

      const attribution = '\n\nСобытие создано с помощью ассистента Voice2Action.';
      const finalDescription = (description || '').includes('Событие создано с помощью ассистента Voice2Action')
        ? (description || '')
        : `${description || ''}${attribution}`.trim();

      const event = {
        summary: title,
        description: finalDescription,
        start: {
          dateTime: start.toISOString(),
          timeZone: USER_TIMEZONE
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: USER_TIMEZONE
        }
      };

      if (colorId)
      {
        event.colorId = colorId;
      }

      const res = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      logger.info(`Calendar event created: ${res.data.id}`);
      return `Event "${title}" создано на ${start.toLocaleString('ru-RU', { timeZone: USER_TIMEZONE })} — ${end.toLocaleString('ru-RU', { timeZone: USER_TIMEZONE })}`;

    } catch (error)
    {
      logger.error('Error creating calendar event:', error);
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }
}
