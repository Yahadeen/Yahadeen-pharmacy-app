import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface OrderCancelledTemplateProps extends BaseTemplateProps {
  orderCode: string;
  cancellationReason: string;
  refundAmount?: string;
  refundDate?: string;
  supportUrl: string;
}

export const orderCancelledTemplate = (props: OrderCancelledTemplateProps): string => {
  const { recipientName, orderCode, cancellationReason, refundAmount, refundDate, supportUrl } = props;

  const content = `
    <h2>Order Cancelled</h2>
    <p>Hi ${recipientName},</p>
    <p>We regret to inform you that your order has been cancelled.</p>
    
    <div class="card card-error">
      <h3 style="color: #ef4444; margin-bottom: 10px;">Cancellation Details</h3>
      <p><strong>Order Code:</strong> ${orderCode}</p>
      <p><strong>Reason:</strong> ${cancellationReason}</p>
    </div>
    
    ${refundAmount ? `
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">Refund Information</h3>
      <p><strong>Refund Amount:</strong> ${refundAmount}</p>
      ${refundDate ? `<p><strong>Expected Refund Date:</strong> ${refundDate}</p>` : ''}
      <p style="font-size: 14px; color: #718096;">Refunds typically take 5-10 business days to appear in your account.</p>
    </div>
    ` : ''}
    
    <p>We apologize for any inconvenience this may have caused. If you have any questions or would like to place a new order, please contact our support team.</p>
    
    <a href="${supportUrl}" class="button button-secondary">Contact Support</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Order Cancelled - ${orderCode}`,
    previewText: `Your order ${orderCode} has been cancelled.`,
  });
};
