import { getBaseTemplate, BaseTemplateProps } from './base-template';

export interface MonthlyReportTemplateProps extends BaseTemplateProps {
  month: string;
  year: number;
  totalOrders: number;
  totalRevenue: string;
  newCustomers: number;
  averageOrderValue: string;
  topProducts: Array<{ name: string; quantity: number }>;
  dashboardUrl: string;
}

export const monthlyReportTemplate = (props: MonthlyReportTemplateProps): string => {
  const { recipientName, month, year, totalOrders, totalRevenue, newCustomers, averageOrderValue, topProducts, dashboardUrl } = props;

  const content = `
    <h2>Monthly Performance Report</h2>
    <p>Hi ${recipientName},</p>
    <p>Here's your monthly performance summary for ${month} ${year}:</p>
    
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
          <td><strong>Average Order Value</strong></td>
          <td>${averageOrderValue}</td>
        </tr>
      </table>
    </div>
    
    <div class="card">
      <h3 style="color: #0036B6; margin-bottom: 10px;">Top Products</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity Sold</th>
          </tr>
        </thead>
        <tbody>
          ${topProducts.map(product => `
            <tr>
              <td>${product.name}</td>
              <td>${product.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <a href="${dashboardUrl}" class="button">View Detailed Report</a>
  `;

  return getBaseTemplate(content, {
    ...props,
    subject: `Monthly Report - ${month} ${year}`,
    previewText: `Your monthly performance summary for ${month} ${year}.`,
  });
};
