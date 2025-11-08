import fs from "fs";
import readline from "readline";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

// Load OAuth client credentials
const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Generate a consent URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

console.log("\nAuthorize this app by visiting this URL:\n");
console.log(authUrl);
console.log("\nAfter authorizing, paste the code below.\n");

// Prompt user for the auth code
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the code from that page here: ", async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync("token.json", JSON.stringify(tokens, null, 2));
    console.log("\n✅ Token stored to token.json");
  } catch (err) {
    console.error("Error retrieving access token:", err);
  }
  rl.close();
});
