export const lowStockAlertTemplate = (productName: string, currentStock: number, threshold: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Low Stock Alert - Yahadeen Pharm Go</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #0036B6, #10BF41);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #0b1220;
      font-size: 20px;
      margin-top: 0;
    }
    .content p {
      color: #4b5768;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .alert-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .alert-box h3 {
      color: #856404;
      margin: 0 0 10px 0;
      font-size: 18px;
    }
    .product-name {
      font-size: 18px;
      font-weight: 700;
      color: #0b1220;
      margin: 10px 0;
    }
    .stock-info {
      font-size: 16px;
      color: #4b5768;
    }
    .stock-info strong {
      color: #ef4444;
    }
    .button {
      display: inline-block;
      background-color: #0036B6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f6f8fb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #7b8798;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Yahadeen Pharm Go</h1>
    </div>
    <div class="content">
      <h2>Low Stock Alert</h2>
      <p>The following product is running low on stock and needs attention:</p>
      
      <div class="alert-box">
        <h3>⚠️ Action Required</h3>
        <div class="product-name">${productName}</div>
        <div class="stock-info">
          Current Stock: <strong>${currentStock}</strong><br>
          Low Stock Threshold: ${threshold}
        </div>
      </div>
      
      <p>Please restock this item soon to avoid stockouts and ensure uninterrupted service.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/inventory" class="button">Manage Inventory</a>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Yahadeen Pharm Go. All rights reserved.</p>
      <p>This is an automated alert. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;
