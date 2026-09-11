export const orderConfirmationTemplate = (customerName: string, orderCode: string, total: string, items: any[]) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed - Yahadeen Pharm Go</title>
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
    .order-details {
      background-color: #f6f8fb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-code {
      font-size: 18px;
      font-weight: 700;
      color: #0036B6;
      margin-bottom: 10px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .items-table th {
      text-align: left;
      padding: 12px;
      background-color: #0036B6;
      color: white;
      font-weight: 600;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #dbe3ec;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .total {
      font-size: 20px;
      font-weight: 700;
      color: #10BF41;
      text-align: right;
      margin-top: 20px;
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
      <h2>Order Confirmed!</h2>
      <p>Hi ${customerName},</p>
      <p>Great news! Your order has been confirmed and is being processed.</p>
      
      <div class="order-details">
        <div class="order-code">Order #${orderCode}</div>
        <table class="items-table">
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
                <td>${item.qty}</td>
                <td>₦${item.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total: ${total}</div>
      </div>
      
      <p>You'll receive updates as your order progresses through preparation and delivery.</p>
      <p>Thank you for choosing Yahadeen Pharm Go!</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Yahadeen Pharm Go. All rights reserved.</p>
      <p>Need help? Contact our support team.</p>
    </div>
  </div>
</body>
</html>
`;
