import { google } from "googleapis";

export async function POST(req: Request) {
  try {
    const { to, toName, subject, fromName, fromEmail, notin } =
      await req.json();

    // Validate input
    if (!to || !subject || !fromName || !fromEmail) {
      return Response.json(
        { error: "Missing required fields: to, subject, fromName, fromEmail" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return Response.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (
      !process.env.GMAIL_CLIENT_ID ||
      !process.env.GMAIL_CLIENT_SECRET ||
      !process.env.GMAIL_REFRESH_TOKEN
    ) {
      console.error("Missing Gmail OAuth credentials in environment variables");
      return Response.json(
        {
          error: "Email service not configured. Please contact administrator.",
        },
        { status: 500 }
      );
    }

    // Initialize OAuth2 client with environment variables
    // Note: redirect_uri doesn't matter for refresh token flow
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "http://localhost:3000/oauth2callback"
    );

    // Set credentials using refresh token from environment
    oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Format proper email addresses with names
    const formattedTo = toName ? `${toName} <${to}>` : to;
    const marketplaceEmail = "ieee.asb@ashoka.edu.in";
    const replyTo = `${fromName} <${fromEmail}>`;

    const rawMessage = !notin
      ? createMessage({
          to: formattedTo,
          from: `Ashoka Marketplace <${marketplaceEmail}>`,
          replyTo: replyTo,
          subject: `Interest in purchase of ${subject} | Ashoka Marketplace`,
          body: `Greetings from IEEE Ashoka. There's an update on the interest for your listing '${subject}'.\n\n${fromName} (${fromEmail}) is interested in purchasing it. View more on the listings page.\n\nYou can reply to this email to contact the buyer directly.\n\nCiao! 💰🪙 💸 🤑 💳 💶`,
        })
      : createMessage({
          to: formattedTo,
          from: `Ashoka Marketplace <${marketplaceEmail}>`,
          replyTo: replyTo,
          subject: `Withdrawal of Interest in purchase of ${subject} | Ashoka Marketplace`,
          body: `Greetings from IEEE Ashoka. There's an update on the interest for your listing '${subject}'.\n\n${fromName} (${fromEmail}) is no longer interested in purchasing it. View more on the listings page.\n\nCiao! 💰🪙 💸 🤑 💳 💶`,
        });

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: rawMessage },
    });

    console.log("Email sent successfully:", result.data.id);
    return Response.json({
      success: true,
      messageId: result.data.id,
    });
  } catch (err) {
    console.error("Email send error:", err);

    // Handle specific Gmail API errors
    if (err instanceof Error) {
      // OAuth/Auth errors
      if (
        err.message.includes("invalid_grant") ||
        err.message.includes("Invalid Credentials")
      ) {
        console.error(
          "Gmail OAuth token expired or invalid. Please regenerate refresh token."
        );
        return Response.json(
          {
            error:
              "Email service authentication failed. Please contact administrator.",
          },
          { status: 500 }
        );
      }

      // Rate limiting
      if (err.message.includes("Rate Limit") || err.message.includes("429")) {
        return Response.json(
          {
            error: "Email service rate limit reached. Please try again later.",
          },
          { status: 429 }
        );
      }

      return Response.json({ error: err.message }, { status: 500 });
    }

    return Response.json(
      { error: "An unknown error occurred while sending email" },
      { status: 500 }
    );
  }
}

// Helper: create a Base64 encoded message
function createMessage({
  to,
  from,
  replyTo,
  subject,
  body,
}: {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  body: string;
}) {
  const headers = [
    `To: ${to}`,
    `From: ${from}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ];

  const message = headers.join("\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
