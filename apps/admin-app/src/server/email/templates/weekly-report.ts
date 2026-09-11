import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface WeeklyReportTemplateProps extends BaseTemplateProps {
  weekStartDate: string;
  weekEndDate: string;
  totalOrders: number;
  totalRevenue: string;
  newCustomers: number;
  lowStockItems: number;
  dashboardUrl: string;
}

export const weeklyReportTemplate = (props: WeeklyReportTemplateProps): string => {
  const { recipientName, weekStartDate, weekEndDate, totalOrders, totalRevenue, newCustomers, lowStockItems, dashboardUrl } = props;

  const content = `
    <h2>Weekly Performance Report</h2>
    <p>Hi ${recipientName},</p>
    <p>Here's your weekly performance summary for ${weekStartDate} to ${weekEndDate}:</p>
    
    <div class="card">
      <h3 style="color: #0036B6; margin-bottom: 10px;">Key Metrics</h3>
      <table class="table">
        <tr>
          <td><strong>Total Orders</strong></td>
          <td>${totalOrders}</td>
        </tr>
        <tr>
          <td><strong>Total Revenue</strong></td>
          <td>${totalRevenue}</td>
        </tr>
        <tr>
          <td><strong>New Customers</strong></td>
          <td>${newCustomers}</td>
        </tr>
        <tr>
          <td><strong>Low Stock Items</strong></td>
          <td style="color: ${lowStockItems > 0 ? '#ef4444' : '#10BF41'}; font-weight: 700;">${lowStockItems}</td>
        </tr>
      </table>
    </div>
    
    ${lowStockItems > 0 ? `
    <div class="card card-warning">
      <p style="color: #856404;"><strong>⚠️ Attention:</strong> You have ${lowStockItems} items with low stock. Please review your inventory.</p>
    </div>
    ` : ''}
    
    <a href="${dashboardUrl}" class="button">View Detailed Report</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Weekly Report - ${weekStartDate} to ${weekEndDate}`,
    previewText: `Your weekly performance summary for ${weekStartDate} to ${weekEndDate}.`,
  });
};
