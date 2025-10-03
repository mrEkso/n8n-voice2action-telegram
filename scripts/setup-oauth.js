#!/usr/bin/env node

/**
 * OAuth Setup Script for Google Calendar & Gmail
 * Run this once to authorize the bot with your Google account
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import { google } from 'googleapis';
import http from 'http';
import open from 'open';
import path from 'path';
import url, { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DATA_DIR = process.env.DATA_DIR || './data';
const CREDENTIALS_PATH = path.join(DATA_DIR, 'google_credentials.json');
const TOKEN_PATH = path.join(DATA_DIR, 'google_token.json');

// OAuth scopes
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.send'
];

async function main ()
{
    console.log('🔐 Google OAuth Setup\n');

    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Load or create credentials
    let credentials;
    try
    {
        const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
        credentials = JSON.parse(content);
        console.log('✅ Loaded credentials from file');
    } catch (error)
    {
        // Create from environment variables
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
        {
            console.error('❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
            process.exit(1);
        }

        credentials = {
            installed: {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uris: ['http://localhost:3000']
            }
        };

        await fs.writeFile(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
        console.log('✅ Created credentials file from environment variables');
    }

    const { client_id, client_secret, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if token already exists
    try
    {
        const token = await fs.readFile(TOKEN_PATH, 'utf-8');
        oAuth2Client.setCredentials(JSON.parse(token));
        console.log('✅ Token already exists and is valid');
        console.log('\n🎉 OAuth setup complete! You can now use Calendar and Gmail features.');
        return;
    } catch (error)
    {
        console.log('📝 No valid token found, starting OAuth flow...\n');
    }

    // Generate auth URL
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Force to get refresh token
    });

    console.log('🌐 Opening browser for authorization...');
    console.log('If browser doesn\'t open, visit this URL manually:\n');
    console.log(authUrl);
    console.log('');

    // Start local server to receive callback
    const server = http.createServer(async (req, res) =>
    {
        try
        {
            const queryObject = url.parse(req.url, true).query;

            if (queryObject.code)
            {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
          <html>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h1>✅ Authorization Successful!</h1>
              <p>You can close this window and return to the terminal.</p>
            </body>
          </html>
        `);

                // Exchange code for token
                const { tokens } = await oAuth2Client.getToken(queryObject.code);
                oAuth2Client.setCredentials(tokens);

                // Save token
                await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
                console.log('\n✅ Token saved successfully!');
                console.log('🎉 OAuth setup complete! You can now use Calendar and Gmail features.');

                server.close();
                process.exit(0);
            } else
            {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error: No authorization code received');
                server.close();
                process.exit(1);
            }
        } catch (error)
        {
            console.error('❌ Error during OAuth callback:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error during authorization');
            server.close();
            process.exit(1);
        }
    });

    server.listen(3000, () =>
    {
        console.log('🚀 Local server started on http://localhost:3000');
        console.log('⏳ Waiting for authorization...\n');

        // Open browser
        open(authUrl).catch(() =>
        {
            console.log('⚠️  Could not open browser automatically. Please open the URL manually.');
        });
    });

    // Timeout after 5 minutes
    setTimeout(() =>
    {
        console.log('\n⏱️  Timeout: No authorization received within 5 minutes');
        server.close();
        process.exit(1);
    }, 300000);
}

main().catch(error =>
{
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
