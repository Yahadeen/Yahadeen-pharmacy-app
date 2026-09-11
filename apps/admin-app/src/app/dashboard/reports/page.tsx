'use client';

import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>('sales');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportType) {
      fetchReport();
    }
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = `/api/admin/reports?type=${reportType}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch report:', response.status);
        setReportData(null);
        return;
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (kobo: number) => {
    return `₦${(kobo / 100).toLocaleString()}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
          Reports
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          View business analytics and performance metrics
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Report Type:</label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
          }}
        >
          <option value="sales">Sales Report</option>
          <option value="best_sellers">Best Selling Products</option>
          <option value="delivery">Delivery Performance</option>
          <option value="low_stock">Low Stock Report</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading report...</div>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          {reportType === 'sales' && reportData && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>
                Sales Report
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Revenue</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>
                    {formatCurrency(reportData.total_revenue_kobo)}
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Orders</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>
                    {reportData.total_orders}
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Average Order Value</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
                    {formatCurrency(reportData.average_order_value_kobo)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'best_sellers' && reportData && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>
                Best Selling Products
              </h2>
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Product
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Quantity Sold
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item: any, index: number) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text)' }}>
                          {item.product_name}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text)' }}>
                          {item.total_quantity_sold}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text)' }}>
                          {formatCurrency(item.total_revenue_kobo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'low_stock' && reportData && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>
                Low Stock Report
              </h2>
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Product
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Current Quantity
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                        Threshold
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item: any, index: number) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text)' }}>
                          {item.product_name}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text)' }}>
                          {item.current_quantity}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
                          {item.low_stock_threshold}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'delivery' && reportData && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>
                Delivery Performance
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Deliveries</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>
                    {reportData.total_deliveries}
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>On-Time Deliveries</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>
                    {reportData.on_time_deliveries}
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Avg Delivery Time</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
                    {reportData.average_delivery_time_minutes}m
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
