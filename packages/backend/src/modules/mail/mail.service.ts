import { Injectable, Logger } from "@nestjs/common";
import { MailgunTransport } from "@upyo/mailgun";
import { createMessage } from "@upyo/core";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: MailgunTransport | null;
  private readonly fromEmail: string;
  private readonly debugMode: boolean;

  constructor() {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const region = process.env.MAILGUN_REGION || "us";
    this.fromEmail = process.env.MAIL_FROM || "postmaster@cosmosli.de";

    // Enable debug mode if NODE_ENV is development or MAIL_DEBUG is set to true
    this.debugMode = process.env.NODE_ENV === "development";

    if (this.debugMode) {
      this.logger.log(
        "Mail debug mode enabled. Emails will be logged to console only.",
      );
      this.transport = null;
    } else if (!apiKey || !domain) {
      this.logger.warn(
        "Mailgun credentials not configured. Emails will be logged to console only.",
      );
      this.transport = null;
    } else {
      this.transport = new MailgunTransport({
        apiKey,
        domain,
        region: region as "us" | "eu",
      });
    }
  }

  async sendMagicLink(email: string, magicLinkUrl: string): Promise<void> {
    const subject = "Sign in to Cosmoslide";
    const html = this.generateMagicLinkHtml(magicLinkUrl);
    const text = this.generateMagicLinkText(magicLinkUrl);

    // If Mailgun is not configured, log to console
    if (!this.transport) {
      this.logger.log(`
========================================
Magic Link Email for ${email}:
URL: ${magicLinkUrl}
========================================
      `);
      return;
    }

    const message = createMessage({
      from: this.fromEmail,
      to: email,
      subject,
      content: {
        html,
        text,
      },
    });

    try {
      const receipt = await this.transport.send(message);
      if (receipt.successful) {
        this.logger.log(
          `Magic link email sent to ${email} with ID: ${receipt.messageId}`,
        );
      } else {
        this.logger.error(
          `Failed to send magic link email to ${email}: ${
            receipt.errorMessages.join(
              ", ",
            )
          }`,
        );
        throw new Error(
          `Email send failed: ${receipt.errorMessages.join(", ")}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending magic link email to ${email}:`, error);
      throw error;
    }
  }

  private generateMagicLinkHtml(magicLinkUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Cosmoslide</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Sign in to Cosmoslide</h1>
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Click the button below to sign in to your account. This link will expire in 15 minutes.
              </p>
              <a href="${magicLinkUrl}" style="display: inline-block; padding: 14px 40px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                Sign In
              </a>
              <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
                <br>
                <a href="${magicLinkUrl}" style="color: #007bff; word-break: break-all;">${magicLinkUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private generateMagicLinkText(magicLinkUrl: string): string {
    return `
Sign in to Cosmoslide

Click the link below to sign in to your account. This link will expire in 15 minutes.

${magicLinkUrl}

If you didn't request this email, you can safely ignore it.
    `.trim();
  }
}
