export const passwordResetTemplate = (name: string, resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Yahadeen Pharm Go</title>
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
    .button {
      display: inline-block;
      background-color: #0036B6;
      color: white;
      padding: 14px 28px;
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
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      font-size: 14px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Yahadeen Pharm Go</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password for your Yahadeen Pharm Go Admin account. Click the button below to set a new password:</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #0036B6;">${resetUrl}</p>
      <div class="warning">
        <strong>Important:</strong> This link will expire in 1 hour for your security.
      </div>
      <p>If you didn't request this password reset, please ignore this email or contact your administrator.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Yahadeen Pharm Go. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;
