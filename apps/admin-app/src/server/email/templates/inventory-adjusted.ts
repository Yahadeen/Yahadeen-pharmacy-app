import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface InventoryAdjustedTemplateProps extends BaseTemplateProps {
  productName: string;
  adjustmentType: 'increase' | 'decrease';
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  adjustedBy: string;
  adjustmentDate: string;
  productUrl: string;
}

export const inventoryAdjustedTemplate = (props: InventoryAdjustedTemplateProps): string => {
  const { recipientName, productName, adjustmentType, previousQuantity, newQuantity, reason, adjustedBy, adjustmentDate, productUrl } = props;

  const isIncrease = adjustmentType === 'increase';
  const badgeClass = isIncrease ? 'success' : 'warning';

  const content = `
    <h2>Inventory Adjustment</h2>
    <p>Hi ${recipientName},</p>
    <p>An inventory adjustment has been made to the following product:</p>
    
    <div class="card">
      <h3 style="color: #0036B6; margin-bottom: 10px;">Adjustment Details</h3>
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Adjustment Type:</strong> <span class="badge badge-${badgeClass}">${adjustmentType.toUpperCase()}</span></p>
      <p><strong>Previous Quantity:</strong> ${previousQuantity}</p>
      <p><strong>New Quantity:</strong> ${newQuantity}</p>
      <p><strong>Change:</strong> ${isIncrease ? '+' : ''}${newQuantity - previousQuantity}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p><strong>Adjusted By:</strong> ${adjustedBy}</p>
      <p><strong>Date:</strong> ${adjustmentDate}</p>
    </div>
    
    <a href="${productUrl}" class="button button-secondary">View Product</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Inventory Adjusted - ${productName}`,
    previewText: `Inventory for ${productName} has been ${adjustmentType}d.`,
  });
};
