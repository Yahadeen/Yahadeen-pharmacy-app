import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface PaymentFailedTemplateProps extends BaseTemplateProps {
  orderCode: string;
  amount: string;
  failureReason: string;
  retryUrl: string;
  supportUrl: string;
}

export const paymentFailedTemplate = (props: PaymentFailedTemplateProps): string => {
  const { recipientName, orderCode, amount, failureReason, retryUrl, supportUrl } = props;

  const content = `
    <h2>Payment Failed</h2>
    <p>Hi ${recipientName},</p>
    <p>We were unable to process your payment. Please review the details below and try again.</p>
    
    <div class="card card-error">
      <h3 style="color: #ef4444; margin-bottom: 10px;">Payment Details</h3>
      <p><strong>Order Code:</strong> ${orderCode}</p>
      <p><strong>Amount:</strong> ${amount}</p>
      <p><strong>Failure Reason:</strong> ${failureReason}</p>
    </div>
    
    <p>Don't worry, your order is still reserved. You can retry the payment using the button below.</p>
    
    <a href="${retryUrl}" class="button">Retry Payment</a>
    
    <p style="margin-top: 20px;">If you continue to experience issues, please contact our support team for assistance.</p>
    
    <a href="${supportUrl}" class="button button-secondary">Contact Support</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Payment Failed - ${orderCode}`,
    previewText: `Payment for order ${orderCode} failed. Please try again.`,
  });
};
