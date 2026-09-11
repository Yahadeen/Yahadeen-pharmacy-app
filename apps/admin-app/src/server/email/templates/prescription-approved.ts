import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface PrescriptionApprovedTemplateProps extends BaseTemplateProps {
  prescriptionNumber: string;
  approvedAt: string;
  approvedBy: string;
  notes?: string;
  orderUrl: string;
}

export const prescriptionApprovedTemplate = (props: PrescriptionApprovedTemplateProps): string => {
  const { recipientName, prescriptionNumber, approvedAt, approvedBy, notes, orderUrl } = props;

  const content = `
    <h2>Prescription Approved!</h2>
    <p>Hi ${recipientName},</p>
    <p>Great news! Your prescription has been approved by our pharmacy team.</p>
    
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">Approval Details</h3>
      <p><strong>Prescription Number:</strong> ${prescriptionNumber}</p>
      <p><strong>Approved At:</strong> ${approvedAt}</p>
      <p><strong>Approved By:</strong> ${approvedBy}</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>
    
    <p>You can now proceed to place your order for the medications in your prescription.</p>
    
    <a href="${orderUrl}" class="button">Place Order</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Prescription Approved - ${prescriptionNumber}`,
    previewText: `Your prescription ${prescriptionNumber} has been approved.`,
  });
};
