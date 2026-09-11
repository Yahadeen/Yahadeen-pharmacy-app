import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface WelcomeTemplateProps extends BaseTemplateProps {
  loginUrl: string;
}

export const welcomeTemplate = (props: WelcomeTemplateProps): string => {
  const { recipientName, loginUrl } = props;

  const content = `
    <h2>Welcome to Yahadeen Pharm Go!</h2>
    <p>Hi ${recipientName},</p>
    <p>We're thrilled to have you join the Yahadeen Pharm Go family. Your account has been successfully created and you're now ready to experience seamless pharmacy management.</p>
    
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">What's Next?</h3>
      <p>Simply click the button below to sign in to your account and get started.</p>
    </div>
    
    <a href="${loginUrl}" class="button">Sign In to Your Account</a>
    
    <p>If you have any questions or need assistance, our support team is here to help. Just reply to this email or reach us at support@yahadeen.ng</p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #718096;">
      <strong>Quick Tips:</strong>
    </p>
    <ul style="color: #4a5568; font-size: 14px; margin-left: 20px;">
      <li>Complete your profile to personalize your experience</li>
      <li>Explore our dashboard to discover all features</li>
      <li>Check out our help center for tutorials and guides</li>
    </ul>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: 'Welcome to Yahadeen Pharm Go!',
    previewText: `Welcome ${recipientName}! Your Yahadeen Pharm Go account is ready.`,
  });
};
