import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface AccountSuspendedTemplateProps extends BaseTemplateProps {
  suspensionReason: string;
  suspendedAt: string;
  supportUrl: string;
}

export const accountSuspendedTemplate = (props: AccountSuspendedTemplateProps): string => {
  const { recipientName, suspensionReason, suspendedAt, supportUrl } = props;

  const content = `
    <h2>Account Suspended</h2>
    <p>Hi ${recipientName},</p>
    <p>Your Yahadeen account has been temporarily suspended.</p>
    
    <div class="card card-error">
      <h3 style="color: #ef4444; margin-bottom: 10px;">Suspension Details</h3>
      <p><strong>Reason:</strong> ${suspensionReason}</p>
      <p><strong>Suspended At:</strong> ${suspendedAt}</p>
    </div>
    
    <p>If you believe this is an error or would like to appeal this suspension, please contact our support team.</p>
    
    <a href="${supportUrl}" class="button">Contact Support</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: 'Account Suspended - Yahadeen Pharm Go',
    previewText: 'Your Yahadeen Pharm Go account has been suspended.',
  });
};
