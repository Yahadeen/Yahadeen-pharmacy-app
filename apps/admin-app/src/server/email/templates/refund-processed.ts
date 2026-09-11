import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface RefundProcessedTemplateProps extends BaseTemplateProps {
  orderCode: string;
  refundAmount: string;
  refundMethod: string;
  refundReference: string;
  processedAt: string;
  expectedCreditDate: string;
}

export const refundProcessedTemplate = (props: RefundProcessedTemplateProps): string => {
  const { recipientName, orderCode, refundAmount, refundMethod, refundReference, processedAt, expectedCreditDate } = props;

  const content = `
    <h2>Refund Processed</h2>
    <p>Hi ${recipientName},</p>
    <p>Your refund has been successfully processed. Here are the details:</p>
    
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">Refund Details</h3>
      <p><strong>Order Code:</strong> ${orderCode}</p>
      <p><strong>Refund Amount:</strong> ${refundAmount}</p>
      <p><strong>Refund Method:</strong> ${refundMethod}</p>
      <p><strong>Reference:</strong> ${refundReference}</p>
      <p><strong>Processed At:</strong> ${processedAt}</p>
      <p><strong>Expected Credit Date:</strong> ${expectedCreditDate}</p>
    </div>
    
    <p style="font-size: 14px; color: #718096;">Refunds typically take 5-10 business days to appear in your account, depending on your bank or payment provider.</p>
    
    <p>If you don't see the refund after this period, please contact our support team with your reference number.</p>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Refund Processed - ${orderCode}`,
    previewText: `Your refund of ${refundAmount} has been processed.`,
  });
};
