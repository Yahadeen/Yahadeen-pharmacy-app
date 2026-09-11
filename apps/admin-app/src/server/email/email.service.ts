/**
 * Email Service - Supports Zoho Mail and OneSignal Email API
 * 
 * This service provides a unified interface for sending transactional emails
 * through either Zoho Mail or OneSignal Email API based on configuration.
 */

export interface EmailConfig {
  provider: 'zoho' | 'onesignal';
  zoho?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    organizationId: string;
    fromEmail: string;
    fromName: string;
  };
  onesignal?: {
    appId: string;
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  contentType: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Send an email using the configured provider
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.config.provider === 'zoho') {
        return await this.sendViaZoho(options);
      } else if (this.config.provider === 'onesignal') {
        return await this.sendViaOneSignal(options);
      } else {
        throw new Error('Invalid email provider configured');
      }
    } catch (error: any) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email via Zoho Mail API
   */
  private async sendViaZoho(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.config.zoho) {
      throw new Error('Zoho configuration not provided');
    }

    const { zoho } = this.config;
    const accessToken = await this.getZohoAccessToken();

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const ccRecipients = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : [];
    const bccRecipients = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [];

    const emailData = {
      from: {
        address: zoho.fromEmail,
        name: zoho.fromName,
      },
      to: recipients.map(email => ({ address: email })),
      cc: ccRecipients.map(email => ({ address: email })),
      bcc: bccRecipients.map(email => ({ address: email })),
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo ? { address: options.replyTo } : undefined,
      attachments: options.attachments?.map(att => ({
        content: att.content,
        filename: att.filename,
        contentType: att.contentType,
      })),
    };

    const response = await fetch(
      `https://mail.zoho.${this.getZohoDomain()}/api/accounts/${zoho.organizationId}/emails`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Zoho API error: ${error}`);
    }

    return { success: true };
  }

  /**
   * Send email via OneSignal Email API
   */
  private async sendViaOneSignal(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.config.onesignal) {
      throw new Error('OneSignal configuration not provided');
    }

    const { onesignal } = this.config;
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const emailData = {
      app_id: onesignal.appId,
      include_email_tokens: recipients,
      email_subject: options.subject,
      email_body: options.html,
      email_from_name: onesignal.fromName,
      email_from_address: onesignal.fromEmail,
      reply_to_email: options.replyTo || onesignal.fromEmail,
      template_id: process.env.ONESIGNAL_EMAIL_TEMPLATE_ID,
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${onesignal.apiKey}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OneSignal API error: ${error}`);
    }

    const result = await response.json();
    if (result.errors && result.errors.length > 0) {
      throw new Error(`OneSignal errors: ${result.errors.join(', ')}`);
    }

    return { success: true };
  }

  /**
   * Get Zoho access token using OAuth 2.0
   */
  private async getZohoAccessToken(): Promise<string> {
    if (!this.config.zoho) {
      throw new Error('Zoho configuration not provided');
    }

    const { zoho } = this.config;

    const response = await fetch(
      `https://accounts.zoho.${this.getZohoDomain()}/oauth/v2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: zoho.refreshToken,
          client_id: zoho.clientId,
          client_secret: zoho.clientSecret,
          grant_type: 'refresh_token',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Zoho OAuth error: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Get Zoho domain based on environment
   */
  private getZohoDomain(): string {
    return process.env.NODE_ENV === 'production' ? 'com' : 'eu';
  }

  /**
   * Send bulk emails (for newsletters, announcements, etc.)
   */
  async sendBulkEmails(
    recipients: string[],
    subject: string,
    html: string,
    text?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const batchSize = 50; // Zoho allows up to 50 recipients per email
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const result = await this.sendEmail({
        to: batch,
        subject,
        html,
        text,
      });

      if (result.success) {
        results.success += batch.length;
      } else {
        results.failed += batch.length;
        results.errors.push(`Batch ${i / batchSize}: ${result.error}`);
      }

      // Rate limiting: wait 1 second between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    const provider = (process.env.EMAIL_PROVIDER as 'zoho' | 'onesignal') || 'zoho';

    const config: EmailConfig = {
      provider,
      zoho: provider === 'zoho' ? {
        clientId: process.env.ZOHO_CLIENT_ID!,
        clientSecret: process.env.ZOHO_CLIENT_SECRET!,
        refreshToken: process.env.ZOHO_REFRESH_TOKEN!,
        organizationId: process.env.ZOHO_ORGANIZATION_ID!,
        fromEmail: process.env.ZOHO_FROM_EMAIL!,
        fromName: process.env.ZOHO_FROM_NAME || 'Yahadeen',
      } : undefined,
      onesignal: provider === 'onesignal' ? {
        appId: process.env.ONESIGNAL_APP_ID!,
        apiKey: process.env.ONESIGNAL_API_KEY!,
        fromEmail: process.env.ONESIGNAL_FROM_EMAIL!,
        fromName: process.env.ONESIGNAL_FROM_NAME || 'Yahadeen',
      } : undefined,
    };

    emailServiceInstance = new EmailService(config);
  }

  return emailServiceInstance;
}
