import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface LowStockAlertTemplateProps extends BaseTemplateProps {
  productName: string;
  currentStock: number;
  lowStockThreshold: number;
  productUrl: string;
  restockUrl: string;
}

export const lowStockAlertTemplate = (props: LowStockAlertTemplateProps): string => {
  const { recipientName, productName, currentStock, lowStockThreshold, productUrl, restockUrl } = props;

  const content = `
    <h2>Low Stock Alert</h2>
    <p>Hi ${recipientName},</p>
    <p>The following product is running low on stock and requires your attention.</p>
    
    <div class="card card-warning">
      <h3 style="color: #f59e0b; margin-bottom: 10px;">⚠️ Action Required</h3>
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Current Stock:</strong> <span style="color: #ef4444; font-weight: 700;">${currentStock}</span></p>
      <p><strong>Low Stock Threshold:</strong> ${lowStockThreshold}</p>
    </div>
    
    <p>Please restock this item soon to avoid stockouts and ensure uninterrupted service for your customers.</p>
    
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <a href="${productUrl}" class="button button-secondary">View Product</a>
      <a href="${restockUrl}" class="button">Restock Now</a>
    </div>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Low Stock Alert - ${productName}`,
    previewText: `${productName} is running low on stock (${currentStock} remaining).`,
  });
};
