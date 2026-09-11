import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface AdminInvitationTemplateProps extends BaseTemplateProps {
  inviterName: string;
  role: string;
  signupUrl: string;
  expiryDate: string;
}

export const adminInvitationTemplate = (props: AdminInvitationTemplateProps): string => {
  const { recipientName, inviterName, role, signupUrl, expiryDate } = props;

  const content = `
    <h2>You're Invited!</h2>
    <p>Hi ${recipientName},</p>
    <p><strong>${inviterName}</strong> has invited you to join the Yahadeen team as a <span class="badge badge-info">${role}</span>.</p>
    
    <p>Yahadeen is a comprehensive pharmacy management system that helps you manage inventory, track orders, and oversee operations efficiently.</p>
    
    <div class="card">
      <h3 style="color: #0036B6; margin-bottom: 10px;">Your Role</h3>
      <p>As a ${role}, you'll have access to tools and features designed to help you succeed in your role.</p>
    </div>
    
    <a href="${signupUrl}" class="button">Accept Invitation</a>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #0036B6; font-size: 14px;">${signupUrl}</p>
    
    <div class="card card-warning">
      <p style="font-size: 14px; color: #856404;">
        <strong>Important:</strong> This invitation will expire on ${expiryDate}. If you don't accept it before then, you'll need to request a new invitation.
      </p>
    </div>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Invitation to Join Yahadeen Pharm Go as ${role}`,
    previewText: `${inviterName} has invited you to join Yahadeen Pharm Go.`,
  });
};
