import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
);

const scopes = [
    'https://www.googleapis.com/auth/gmail.send'
];

const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
});

console.log('Authorize this app by visiting this url:', url);

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('Enter the code from that page here: ', async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Refresh token:', tokens.refresh_token);
        readline.close();
    } catch (error) {
        console.error('Error getting refresh token:', error);
        readline.close();
    }
}); 