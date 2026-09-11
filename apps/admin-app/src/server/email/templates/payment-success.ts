import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface PaymentSuccessTemplateProps extends BaseTemplateProps {
  orderCode: string;
  amount: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
  receiptUrl: string;
}

export const paymentSuccessTemplate = (props: PaymentSuccessTemplateProps): string => {
  const { recipientName, orderCode, amount, paymentMethod, transactionReference, paymentDate, receiptUrl } = props;

  const content = `
    <h2>Payment Successful!</h2>
    <p>Hi ${recipientName},</p>
    <p>Great news! Your payment has been processed successfully.</p>
    
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">Payment Details</h3>
      <p><strong>Order Code:</strong> ${orderCode}</p>
      <p><strong>Amount Paid:</strong> ${amount}</p>
      <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      <p><strong>Transaction Reference:</strong> ${transactionReference}</p>
      <p><strong>Payment Date:</strong> ${paymentDate}</p>
    </div>
    
    <p>Your order is now being processed. You'll receive updates as it moves through the fulfillment process.</p>
    
    <a href="${receiptUrl}" class="button">View Receipt</a>
    
    <p style="font-size: 14px; color: #718096;">Please save this email for your records. If you have any questions about your payment, please contact our support team.</p>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Payment Successful - ${orderCode}`,
    previewText: `Your payment of ${amount} for order ${orderCode} was successful.`,
  });
};
