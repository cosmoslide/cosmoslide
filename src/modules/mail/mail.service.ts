import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendMagicLink(email: string, magicLinkUrl: string): Promise<void> {
    // TODO: Implement actual email sending
    // For now, just log the magic link
    console.log(`
      ========================================
      Magic Link for ${email}:
      ${magicLinkUrl}
      ========================================
    `);
    
    // In production, you would use a service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - etc.
  }
}