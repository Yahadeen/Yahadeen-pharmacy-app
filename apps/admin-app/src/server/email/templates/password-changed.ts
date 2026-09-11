import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface PasswordChangedTemplateProps extends BaseTemplateProps {
  changedAt: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export const passwordChangedTemplate = (props: PasswordChangedTemplateProps): string => {
  const { recipientName, changedAt, ipAddress, deviceInfo } = props;

  const content = `
    <h2>Password Changed Successfully</h2>
    <p>Hi ${recipientName},</p>
    <p>Your Yahadeen Pharm Go account password has been changed successfully.</p>
    
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">Change Details</h3>
      <p><strong>Date:</strong> ${changedAt}</p>
      ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
      ${deviceInfo ? `<p><strong>Device:</strong> ${deviceInfo}</p>` : ''}
    </div>
    
    <p>If you didn't make this change, please contact our support team immediately to secure your account.</p>
    
    <a href="mailto:support@yahadeen.ng" class="button button-secondary">Contact Support</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: 'Password Changed Successfully - Yahadeen Pharm Go',
    previewText: 'Your Yahadeen Pharm Go password has been changed.',
  });
};
