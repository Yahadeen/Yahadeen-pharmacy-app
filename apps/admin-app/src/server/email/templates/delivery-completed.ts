import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface DeliveryCompletedTemplateProps extends BaseTemplateProps {
  orderCode: string;
  deliveredAt: string;
  deliveryAddress: string;
  reviewUrl: string;
  supportUrl: string;
}

export const deliveryCompletedTemplate = (props: DeliveryCompletedTemplateProps): string => {
  const { recipientName, orderCode, deliveredAt, deliveryAddress, reviewUrl, supportUrl } = props;

  const content = `
    <h2>Delivery Completed!</h2>
    <p>Hi ${recipientName},</p>
    <p>Your order has been successfully delivered. Thank you for choosing Yahadeen Pharm Go!</p>
    
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">Delivery Confirmation</h3>
      <p><strong>Order Code:</strong> ${orderCode}</p>
      <p><strong>Delivered At:</strong> ${deliveredAt}</p>
      <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
    </div>
    
    <p>We hope you're satisfied with your order. If you have any issues or questions, please don't hesitate to reach out to our support team.</p>
    
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <a href="${reviewUrl}" class="button">Leave a Review</a>
      <a href="${supportUrl}" class="button button-secondary">Need Help?</a>
    </div>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Delivery Completed - ${orderCode}`,
    previewText: `Your order ${orderCode} has been delivered.`,
  });
};
