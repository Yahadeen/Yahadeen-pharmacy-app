import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface SecurityAlertTemplateProps extends BaseTemplateProps {
  alertType: 'login_attempt' | 'password_change' | 'account_update' | 'suspicious_activity';
  alertDetails: string;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
  timestamp: string;
  actionRequired: boolean;
  actionUrl?: string;
}

export const securityAlertTemplate = (props: SecurityAlertTemplateProps): string => {
  const { recipientName, alertType, alertDetails, ipAddress, deviceInfo, location, timestamp, actionRequired, actionUrl } = props;

  const alertTypeLabels = {
    login_attempt: 'New Login Attempt',
    password_change: 'Password Changed',
    account_update: 'Account Updated',
    suspicious_activity: 'Suspicious Activity Detected',
  };

  const content = `
    <h2>Security Alert</h2>
    <p>Hi ${recipientName},</p>
    <p>We detected the following security activity on your account:</p>
    
    <div class="card card-error">
      <h3 style="color: #ef4444; margin-bottom: 10px;">${alertTypeLabels[alertType]}</h3>
      <p><strong>Details:</strong> ${alertDetails}</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
      ${deviceInfo ? `<p><strong>Device:</strong> ${deviceInfo}</p>` : ''}
      ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
    </div>
    
    ${actionRequired ? `
    <p><strong>Action Required:</strong> If you did not perform this action, please secure your account immediately.</p>
    <a href="${actionUrl}" class="button">Secure Your Account</a>
    ` : `
    <p>If you did not perform this action, please contact our support team immediately.</p>
    `}
    
    <a href="mailto:support@yahadeen.ng" class="button button-secondary">Contact Support</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Security Alert - ${alertTypeLabels[alertType]}`,
    previewText: `Security alert: ${alertTypeLabels[alertType]}`,
  });
};
