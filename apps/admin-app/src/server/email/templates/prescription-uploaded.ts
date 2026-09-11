import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface PrescriptionUploadedTemplateProps extends BaseTemplateProps {
  prescriptionId: string;
  prescriptionNumber: string;
  uploadedAt: string;
  viewUrl: string;
}

export const prescriptionUploadedTemplate = (props: PrescriptionUploadedTemplateProps): string => {
  const { recipientName, prescriptionId, prescriptionNumber, uploadedAt, viewUrl } = props;

  const content = `
    <h2>Prescription Uploaded</h2>
    <p>Hi ${recipientName},</p>
    <p>Your prescription has been successfully uploaded and is now being reviewed by our pharmacy team.</p>
    
    <div class="card">
      <h3 style="color: #0036B6; margin-bottom: 10px;">Prescription Details</h3>
      <p><strong>Prescription Number:</strong> ${prescriptionNumber}</p>
      <p><strong>Uploaded At:</strong> ${uploadedAt}</p>
    </div>
    
    <p>Our team will review your prescription within 24-48 hours. You'll receive a notification once it's been approved or if we need any additional information.</p>
    
    <a href="${viewUrl}" class="button">View Prescription</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Prescription Uploaded - ${prescriptionNumber}`,
    previewText: `Your prescription ${prescriptionNumber} has been uploaded.`,
  });
};
