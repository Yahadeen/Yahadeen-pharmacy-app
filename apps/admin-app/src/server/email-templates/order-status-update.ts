export const orderStatusUpdateTemplate = (customerName: string, orderCode: string, status: string, message: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Update - Yahadeen Pharm Go</title>
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
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      margin: 10px 0;
    }
    .status-confirmed { background-color: #3b82f6; color: white; }
    .status-preparing { background-color: #8b5cf6; color: white; }
    .status-ready { background-color: #10b981; color: white; }
    .status-delivered { background-color: #10BF41; color: white; }
    .status-cancelled { background-color: #ef4444; color: white; }
    .order-code {
      font-size: 18px;
      font-weight: 700;
      color: #0036B6;
      margin: 10px 0;
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
      <h2>Order Update</h2>
      <p>Hi ${customerName},</p>
      <p>Your order status has been updated:</p>
      
      <div class="order-code">Order #${orderCode}</div>
      <span class="status-badge status-${status.toLowerCase().replace(' ', '-')}">${status}</span>
      
      <p>${message}</p>
      
      <p>You can track your order in the Yahadeen app for real-time updates.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Yahadeen Pharm Go. All rights reserved.</p>
      <p>Need help? Contact our support team.</p>
    </div>
  </div>
</body>
</html>
`;
