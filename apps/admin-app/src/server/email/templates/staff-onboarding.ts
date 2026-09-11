import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface StaffOnboardingTemplateProps extends BaseTemplateProps {
  staffName: string;
  role: string;
  startDate: string;
  managerName: string;
  managerEmail: string;
  onboardingGuideUrl: string;
  loginUrl: string;
}

export const staffOnboardingTemplate = (props: StaffOnboardingTemplateProps): string => {
  const { recipientName, staffName, role, startDate, managerName, managerEmail, onboardingGuideUrl, loginUrl } = props;

  const content = `
    <h2>Welcome to the Team!</h2>
    <p>Hi ${recipientName},</p>
    <p>We're excited to welcome <strong>${staffName}</strong> to the Yahadeen Pharm Go team as a <strong>${role}</strong>.</p>
    
    <div class="card">
      <h3 style="color: #0036B6; margin-bottom: 10px;">Onboarding Details</h3>
      <p><strong>Staff Member:</strong> ${staffName}</p>
      <p><strong>Role:</strong> ${role}</p>
      <p><strong>Start Date:</strong> ${startDate}</p>
      <p><strong>Manager:</strong> ${managerName}</p>
      <p><strong>Manager Email:</strong> <a href="mailto:${managerEmail}">${managerEmail}</a></p>
    </div>
    
    <p>Please review the onboarding guide to help ${staffName} get settled in.</p>
    
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <a href="${onboardingGuideUrl}" class="button">View Onboarding Guide</a>
      <a href="${loginUrl}" class="button button-secondary">Staff Login</a>
    </div>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `New Staff Onboarding - ${staffName}`,
    previewText: `${staffName} is joining the Yahadeen Phar Go team as ${role}.`,
  });
};
