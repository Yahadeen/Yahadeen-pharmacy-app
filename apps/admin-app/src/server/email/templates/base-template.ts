/**
 * Base Email Template
 * Provides consistent styling and structure for all email templates
 */

export interface BaseTemplateProps {
  recipientName: string;
  subject: string;
  previewText?: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  websiteUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export const getBaseTemplate = (
  content: string,
  props: BaseTemplateProps
): string => {
  const {
    recipientName,
    subject,
    previewText = '',
    logoUrl = 'https://yahadeen.ng/logo.png',
    companyName = 'Yahadeen Pharm Go',
    companyAddress = 'Lagos, Nigeria',
    companyPhone = '+234 XXX XXX XXXX',
    companyEmail = 'support@yahadeen.ng',
    websiteUrl = 'https://yahadeen.ng',
    socialLinks = {},
  } = props;

  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  ${previewText ? `<meta name="preview" content="${previewText}">` : ''}
  <style>
    /* Reset styles */
    body, p, h1, h2, h3, h4, h5, h6 {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
    }
    
    body {
      background-color: #f8f9fa;
      color: #333;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #0036B6 0%, #10BF41 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .header img {
      max-width: 150px;
      height: auto;
    }
    
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    
    /* Content */
    .content {
      padding: 40px 30px;
    }
    
    .content h2 {
      color: #0036B6;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    
    .content p {
      color: #4a5568;
      font-size: 16px;
      margin-bottom: 16px;
    }
    
    .content a {
      color: #0036B6;
      text-decoration: none;
      font-weight: 600;
    }
    
    /* Buttons */
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #0036B6 0%, #0044CC 100%);
      color: #ffffff;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0, 54, 182, 0.2);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 54, 182, 0.3);
    }
    
    .button-secondary {
      background: #f7fafc;
      color: #0036B6;
      border: 2px solid #0036B6;
    }
    
    /* Cards */
    .card {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #0036B6;
    }
    
    .card-success {
      border-left-color: #10BF41;
      background-color: #f0fdf4;
    }
    
    .card-warning {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }
    
    .card-error {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }
    
    /* Tables */
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .table th {
      background-color: #0036B6;
      color: #ffffff;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    
    .table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .table tr:last-child td {
      border-bottom: none;
    }
    
    /* Badges */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .badge-success {
      background-color: #10BF41;
      color: #ffffff;
    }
    
    .badge-warning {
      background-color: #f59e0b;
      color: #ffffff;
    }
    
    .badge-error {
      background-color: #ef4444;
      color: #ffffff;
    }
    
    .badge-info {
      background-color: #3b82f6;
      color: #ffffff;
    }
    
    /* Divider */
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 30px 0;
    }
    
    /* Footer */
    .footer {
      background-color: #f7fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      color: #718096;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .footer a {
      color: #0036B6;
      text-decoration: none;
    }
    
    .footer-social {
      margin: 20px 0;
    }
    
    .footer-social a {
      display: inline-block;
      margin: 0 8px;
      color: #718096;
      text-decoration: none;
      font-size: 20px;
    }
    
    .footer-social a:hover {
      color: #0036B6;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100%;
        border-radius: 0;
      }
      
      .header, .content, .footer {
        padding: 20px;
      }
      
      .button {
        display: block;
        width: 100%;
        text-align: center;
      }
      
      .table {
        font-size: 14px;
      }
      
      .table th, .table td {
        padding: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <img src="${logoUrl}" alt="${companyName} Logo" />
      <h1>${companyName}</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      ${content}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>&copy; ${currentYear} ${companyName}. All rights reserved.</p>
      <p>${companyAddress}</p>
      <p>
        <a href="tel:${companyPhone}">${companyPhone}</a> | 
        <a href="mailto:${companyEmail}">${companyEmail}</a>
      </p>
      <p>
        <a href="${websiteUrl}">${websiteUrl}</a>
      </p>
      
      ${socialLinks.facebook || socialLinks.twitter || socialLinks.instagram || socialLinks.linkedin ? `
      <div class="footer-social">
        ${socialLinks.facebook ? `<a href="${socialLinks.facebook}">Facebook</a>` : ''}
        ${socialLinks.twitter ? `<a href="${socialLinks.twitter}">Twitter</a>` : ''}
        ${socialLinks.instagram ? `<a href="${socialLinks.instagram}">Instagram</a>` : ''}
        ${socialLinks.linkedin ? `<a href="${socialLinks.linkedin}">LinkedIn</a>` : ''}
      </div>
      ` : ''}
      
      <p style="font-size: 12px; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>`;
};
