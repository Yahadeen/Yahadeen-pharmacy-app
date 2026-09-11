import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface DeliveryScheduledTemplateProps extends BaseTemplateProps {
  orderCode: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: string;
  driverName?: string;
  driverPhone?: string;
  trackDeliveryUrl: string;
}

export const deliveryScheduledTemplate = (props: DeliveryScheduledTemplateProps): string => {
  const { recipientName, orderCode, deliveryDate, deliveryTime, deliveryAddress, driverName, driverPhone, trackDeliveryUrl } = props;

  const content = `
    <h2>Delivery Scheduled!</h2>
    <p>Hi ${recipientName},</p>
    <p>Your order is out for delivery! Here are your delivery details:</p>
    
    <div class="card card-success">
      <h3 style="color: #10BF41; margin-bottom: 10px;">Delivery Information</h3>
      <p><strong>Order Code:</strong> ${orderCode}</p>
      <p><strong>Date:</strong> ${deliveryDate}</p>
      <p><strong>Time:</strong> ${deliveryTime}</p>
      <p><strong>Address:</strong> ${deliveryAddress}</p>
      ${driverName ? `<p><strong>Driver:</strong> ${driverName}</p>` : ''}
      ${driverPhone ? `<p><strong>Driver Phone:</strong> <a href="tel:${driverPhone}">${driverPhone}</a></p>` : ''}
    </div>
    
    <p>Please ensure someone is available at the delivery address to receive the package.</p>
    
    <a href="${trackDeliveryUrl}" class="button">Track Delivery</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Delivery Scheduled - ${orderCode}`,
    previewText: `Your order ${orderCode} delivery has been scheduled.`,
  });
};
