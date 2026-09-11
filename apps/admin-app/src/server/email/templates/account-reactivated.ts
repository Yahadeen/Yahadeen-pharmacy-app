import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface AccountReactivatedTemplateProps extends BaseTemplateProps {
  reactivatedAt: string;
  loginUrl: string;
}

export const accountReactivatedTemplate = (props: AccountReactivatedTemplateProps): string => {
  const { recipientName, reactivatedAt, loginUrl } = props;

  const content = `
    <h2>Account Reactivated!</h2>
    <p>Hi ${recipientName},</p>
    <p>Great news! Your Yahadeen account has been reactivated and you can now access all features.</p>
    
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">Welcome Back!</h3>
      <p><strong>Reactivated At:</strong> ${reactivatedAt}</p>
    </div>
    
    <a href="${loginUrl}" class="button">Sign In to Your Account</a>
    
    <p>If you have any questions, please don't hesitate to contact our support team.</p>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: 'Account Reactivated - Yahadeen Pharm Go',
    previewText: 'Your Yahadeen Pharm Go account has been reactivated.',
  });
};
