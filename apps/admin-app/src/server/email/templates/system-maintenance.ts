import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface SystemMaintenanceTemplateProps extends BaseTemplateProps {
  maintenanceStart: string;
  maintenanceEnd: string;
  affectedServices: string[];
  reason: string;
}

export const systemMaintenanceTemplate = (props: SystemMaintenanceTemplateProps): string => {
  const { recipientName, maintenanceStart, maintenanceEnd, affectedServices, reason } = props;

  const content = `
    <h2>Scheduled System Maintenance</h2>
    <p>Hi ${recipientName},</p>
    <p>We will be performing scheduled system maintenance to improve our services.</p>
    
    <div class="card card-warning">
      <h3 style="color: #f59e0b; margin-bottom: 10px;">Maintenance Details</h3>
      <p><strong>Start:</strong> ${maintenanceStart}</p>
      <p><strong>End:</strong> ${maintenanceEnd}</p>
      <p><strong>Reason:</strong> ${reason}</p>
    </div>
    
    <div class="card">
      <h3 style="color: #0036B6; margin-bottom: 10px;">Affected Services</h3>
      <ul style="margin-left: 20px; color: #4a5568;">
        ${affectedServices.map(service => `<li>${service}</li>`).join('')}
      </ul>
    </div>
    
    <p>During this period, you mayexperience temporary service interruptions. We apologize for any inconvenience and appreciate your patience.</p>
    
    <p style="font-size: 14px; color: #718096;">If you have any urgent needs during the maintenance window, please contact our support team.</p>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: 'Scheduled System Maintenance - Yahadeen Pharm Go',
    previewText: 'System maintenance scheduled from ' + maintenanceStart,
  });
};
