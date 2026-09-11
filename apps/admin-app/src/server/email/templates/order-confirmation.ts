import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface OrderConfirmationTemplateProps extends BaseTemplateProps {
  orderCode: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  trackOrderUrl: string;
}

export const orderConfirmationTemplate = (props: OrderConfirmationTemplateProps): string => {
  const { recipientName, orderCode, items, total, deliveryAddress, estimatedDelivery, trackOrderUrl } = props;

  const content = `
    <h2>Order Confirmed!</h2>
    <p>Hi ${recipientName},</p>
    <p>Great news! Your order has been confirmed and is being processed. Thank you for choosing Yahadeen Pharm Go for your pharmacy needs.</p>
    
    <div class="card">
      <h3 style="color: #0036B6; margin-bottom: 10px;">Order Details</h3>
      <p><strong>Order Code:</strong> <span class="badge badge-info">${orderCode}</span></p>
      ${deliveryAddress ? `<p><strong>Delivery Address:</strong> ${deliveryAddress}</p>` : ''}
      ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
    </div>
    
    <table class="table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div style="text-align: right; margin: 20px 0;">
      <p style="font-size: 20px; font-weight: 700; color: #10BF41;">Total: ${total}</p>
    </div>
    
    <a href="${trackOrderUrl}" class="button">Track Your Order</a>
    
    <p>You'll receive updates as your order progresses through preparation and delivery. You can also track your order in real-time using the button above.</p>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Order Confirmed - ${orderCode}`,
    previewText: `Your order ${orderCode} has been confirmed.`,
  });
};
