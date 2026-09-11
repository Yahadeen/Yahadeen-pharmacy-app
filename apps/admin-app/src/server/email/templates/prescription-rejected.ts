import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface PrescriptionRejectedTemplateProps extends BaseTemplateProps {
  prescriptionNumber: string;
  rejectedAt: string;
  rejectedBy: string;
  rejectionReason: string;
  supportUrl: string;
}

export const prescriptionRejectedTemplate = (props: PrescriptionRejectedTemplateProps): string => {
  const { recipientName, prescriptionNumber, rejectedAt, rejectedBy, rejectionReason, supportUrl } = props;

  const content = `
    <h2>Prescription Review Update</h2>
    <p>Hi ${recipientName},</p>
    <p>We've reviewed your prescription and need additional information or clarification before we can proceed.</p>
    
    <div class="card card-warning">
      <h3 style="color: #f59e0b; margin-bottom: 10px;">Review Details</h3>
      <p><strong>Prescription Number:</strong> ${prescriptionNumber}</p>
      <p><strong>Reviewed At:</strong> ${rejectedAt}</p>
      <p><strong>Reviewed By:</strong> ${rejectedBy}</p>
      <p><strong>Reason:</strong> ${rejectionReason}</p>
    </div>
    
    <p>Please upload a clearer image of your prescription or contact our pharmacy team for assistance.</p>
    
    <a href="${supportUrl}" class="button">Contact Support</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Prescription Review Update - ${prescriptionNumber}`,
    previewText: `Update on your prescription ${prescriptionNumber}.`,
  });
};
