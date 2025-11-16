import { google } from "googleapis";
import http from "http";
import { parse } from "url";

/**
 * Script to generate Gmail OAuth2 refresh token
 *
 * Setup:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable Gmail API
 * 4. Create OAuth 2.0 Client ID:
 *    - Choose "Web application" (NOT Desktop app - OOB is deprecated)
 *    - Add authorized redirect URI: http://localhost:3000/oauth2callback
 * 5. Add to .env.local file:
 *    GMAIL_CLIENT_ID=your_client_id
 *    GMAIL_CLIENT_SECRET=your_client_secret
 *
 * Run from project root: bun run app/api/email-send/getToken.ts
 */

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];
const REDIRECT_URI = "http://localhost:3000/oauth2callback";

// Load credentials from environment variables
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("\n❌ Error: Missing Gmail OAuth credentials");
  console.error(
    "Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env.local file\n"
  );
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate a consent URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // Force consent screen to get refresh token
});

console.log("\n📧 Gmail OAuth2 Token Generator");
console.log("================================\n");
console.log("🌐 Starting local server on http://localhost:3000");
console.log("\n1. Your browser will open automatically");
console.log("2. Sign in with your Gmail account");
console.log("3. Grant permissions");
console.log("4. You'll be redirected back and the token will be generated\n");

// Create a local server to receive the OAuth callback
const server = http.createServer(async (req, res) => {
  try {
    if (req.url && req.url.indexOf("/oauth2callback") > -1) {
      const qs = parse(req.url, true).query;
      const code = qs.code as string;

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Gmail OAuth Success</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 100px auto; text-align: center; }
              .success { color: #22c55e; font-size: 48px; }
              code { background: #f3f4f6; padding: 12px; border-radius: 6px; display: block; margin: 20px 0; word-break: break-all; }
            </style>
          </head>
          <body>
            <div class="success">✅</div>
            <h1>Authorization Successful!</h1>
            <p>You can close this window and return to your terminal.</p>
          </body>
        </html>
      `);

      const { tokens } = await oAuth2Client.getToken(code);

      console.log("\n✅ Success! Add this to your .env.local file:\n");
      console.log("GMAIL_REFRESH_TOKEN=" + tokens.refresh_token);
      console.log("\n💡 Full token object (for reference):");
      console.log(JSON.stringify(tokens, null, 2));
      console.log("\n");

      server.close();
      process.exit(0);
    }
  } catch (err) {
    console.error("\n❌ Error retrieving access token:");
    console.error(err);
    process.exit(1);
  }
});

server.listen(3000, () => {
  console.log("Opening browser...\n");

  // Auto-open browser
  const open = async (url: string) => {
    const { spawn } = await import("child_process");
    const cmd =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
        ? "start"
        : "xdg-open";
    spawn(cmd, [url]);
  };

  open(authUrl);

  console.log("If browser doesn't open, visit this URL manually:\n");
  console.log(authUrl);
  console.log("\n");
});
