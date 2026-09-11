import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface AccountVerifiedTemplateProps extends BaseTemplateProps {
  loginUrl: string;
}

export const accountVerifiedTemplate = (props: AccountVerifiedTemplateProps): string => {
  const { recipientName, loginUrl } = props;

  const content = `
    <h2>Account Verified!</h2>
    <p>Hi ${recipientName},</p>
    <p>Congratulations! Your Yahadeen account has been successfully verified.</p>
    
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">You're All Set!</h3>
      <p>You can now access all the features of your Yahadeen account.</p>
    </div>
    
    <a href="${loginUrl}" class="button">Sign In to Your Account</a>
    
    <p>If you have any questions or need assistance, our support team is here to help.</p>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: 'Account Verified - Yahadeen Pharm Go',
    previewText: 'Your Yahadeen Pharm Go account has been verified.',
  });
};
