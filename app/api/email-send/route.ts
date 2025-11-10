import fs from "fs";
import path from "path";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

export async function POST(req) {
  try {
    const { to, subject, who, notin } = await req.json();
    // const who = "someone"
    // Load OAuth2 credentials
    const credentialsPath = path.join(process.cwd(), "app/api/email-send/credentials.json");
    const tokenPath = path.join(process.cwd(), "app/api/email-send/token.json");

    const credentials = JSON.parse(fs.readFileSync(credentialsPath));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // // Load token or request a new one
    if (!fs.existsSync(tokenPath)) {
      throw new Error("token.json not found. Run getToken() first.");
    }
    const token = JSON.parse(fs.readFileSync(tokenPath));
    oAuth2Client.setCredentials(token);

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const rawMessage = !notin ? createMessage({
      to: `${to}`,
      from: `${who}`,
      subject: `Interest in purchase of ${subject} | Ashoka Marketplace`,
      body: `Greetings from IEEE Ashoka. There's an update on the interest for your listing '${subject}'.\n\n${who} is interested in purchasing it. View more on the listings page.\n\nCiao! 💰🪙 💸 🤑 💳 💶 `
    }) : createMessage({
      to: `${to}`,
      from: `${who}`,
      subject: `Withdrawal of Interest in purchase of ${subject} | Ashoka Marketplace`,
      body: `Greetings from IEEE Ashoka. There's an update on the interest for your listing '${subject}'.\n\n${who} is no longer interested in purchasing it. View more on the listings page.\n\nCiao! 💰🪙 💸 🤑 💳 💶 `
    });

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: rawMessage },
    });

    console.log("Email sent successfully:", result.data);
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Helper: create a Base64 encoded message
function createMessage({ to, from, subject, body }) {
  const message = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    "",
    body,
  ].join("\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

