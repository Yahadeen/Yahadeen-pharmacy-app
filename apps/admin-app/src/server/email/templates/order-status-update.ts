import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface OrderStatusUpdateTemplateProps extends BaseTemplateProps {
  orderCode: string;
  status: string;
  statusBadge: 'success' | 'warning' | 'info' | 'error';
  message: string;
  trackOrderUrl: string;
}

export const orderStatusUpdateTemplate = (props: OrderStatusUpdateTemplateProps): string => {
  const { recipientName, orderCode, status, statusBadge, message, trackOrderUrl } = props;

  const content = `
    <h2>Order Status Update</h2>
    <p>Hi ${recipientName},</p>
    <p>Your order status has been updated. Here are the details:</p>
    
    <div class="card">
      <p><strong>Order Code:</strong> <span class="badge badge-info">${orderCode}</span></p>
      <p><strong>New Status:</strong> <span class="badge badge-${statusBadge}">${status}</span></p>
    </div>
    
    <p>${message}</p>
    
    <a href="${trackOrderUrl}" class="button">Track Your Order</a>
    
    <p>You can track your order in the Yahadeen app for real-time updates. If you have any questions about your order, please don't hesitate to contact our support team.</p>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Order Update - ${orderCode}`,
    previewText: `Your order ${orderCode} status is now: ${status}`,
  });
};
