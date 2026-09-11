import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface PasswordResetTemplateProps extends BaseTemplateProps {
  resetUrl: string;
  expiryTime: string;
}

export const passwordResetTemplate = (props: PasswordResetTemplateProps): string => {
  const { recipientName, resetUrl, expiryTime } = props;

  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${recipientName},</p>
    <p>We received a request to reset your password for your Yahadeen Pharm Go account. If you didn't make this request, you can safely ignore this email.</p>
    
    <p>To reset your password, click the button below:</p>
    
    <a href="${resetUrl}" class="button">Reset Password</a>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #0036B6; font-size: 14px;">${resetUrl}</p>
    
    <div class="card card-warning">
      <p style="font-size: 14px; color: #856404;">
        <strong>Important:</strong> This link will expire in ${expiryTime} for your security.
      </p>
    </div>
    
    <p>If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: 'Reset Your Password - Yahadeen Pharm Go',
    previewText: 'Reset your Yahadeen Pharm Go account password.',
  });
};
