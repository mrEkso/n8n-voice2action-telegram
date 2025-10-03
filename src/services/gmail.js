/**
 * Gmail Service
 * Send emails using Gmail API
 */

import fs from 'fs/promises';
import { google } from 'googleapis';
import path from 'path';
import { logger } from '../utils/logger.js';

export class GmailService
{
  constructor(dataDir)
  {
    this.dataDir = dataDir;
    this.credentialsPath = path.join(dataDir, 'google_credentials.json');
    this.tokenPath = path.join(dataDir, 'google_token.json');
    this.gmail = null;
  }

  /**
   * Initialize Gmail API client
   */
  async initialize ()
  {
    if (this.gmail) return;

    try
    {
      const credentials = await this.loadCredentials();
      const auth = await this.authorize(credentials);
      this.gmail = google.gmail({ version: 'v1', auth });
      logger.info('Gmail service initialized');
    } catch (error)
    {
      logger.error('Gmail initialization error:', error);
      throw new Error('Gmail not configured. Please set up OAuth credentials.');
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
      // Create credentials file from environment variables
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
   * Send email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.body - Email body
   * @returns {Promise<string>} - Result message
   */
  async sendEmail ({ to, subject, body })
  {
    await this.initialize();

    if (!to)
    {
      throw new Error('Recipient email address is required');
    }

    try
    {
      const message = this.createMessage(to, subject, body);
      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      logger.info(`Email sent successfully: ${res.data.id}`);
      return `Email sent to ${to}`;

    } catch (error)
    {
      logger.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Create RFC 2822 formatted email message
   */
  createMessage (to, subject, body)
  {
    const encodedSubject = this.encodeHeaderValue(subject);
    const message = [
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      body
    ].join('\n');

    return message;
  }

  encodeHeaderValue (value)
  {
    if (!value) return '';
    const needsEncoding = /[^\x20-\x7E]/.test(value);
    if (!needsEncoding)
    {
      return value;
    }

    const base64Value = Buffer.from(value, 'utf8').toString('base64');
    return `=?UTF-8?B?${base64Value}?=`;
  }
}
