const SITE_URL = process.env.SITE_URL || 'https://nicheshunter.app';

function basePage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Niches Hunter</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #111;
      border: 1px solid #222;
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px; }
    p { font-size: 15px; color: #888; line-height: 1.6; margin-bottom: 20px; }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #00CC6A; color: #000; }
    .btn-secondary { background: #222; color: #fff; margin-left: 8px; }
    .error { color: #ff6b6b; }
    .footer { margin-top: 32px; font-size: 12px; color: #444; }
    .footer a { color: #00CC6A; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
    <div class="footer">
      <a href="${SITE_URL}">nicheshunter.app</a>
    </div>
  </div>
</body>
</html>`;
}

export function getUnsubscribeHTML(success: boolean, errorMessage?: string): string {
  if (success) {
    return basePage('Unsubscribed', `
      <div class="icon">🔕</div>
      <h1>You've been unsubscribed</h1>
      <p>You won't receive the weekly API mailing anymore.<br>Your API account and credits are still active.</p>
      <a href="${SITE_URL}/developers" class="btn btn-primary">Open API Dashboard</a>
      <p style="margin-top:24px;font-size:13px;color:#555;">Changed your mind? <a href="" id="resub" style="color:#00CC6A;text-decoration:underline;">Re-subscribe</a></p>
      <script>
        const email = new URLSearchParams(window.location.search).get('email');
        if (email) document.getElementById('resub').href = '/api-resubscribe?email=' + encodeURIComponent(email);
      </script>
    `);
  }

  return basePage('Unsubscribe', `
    <div class="icon">⚠️</div>
    <h1 class="error">Oops</h1>
    <p>${errorMessage || 'Something went wrong.'}</p>
    <a href="${SITE_URL}" class="btn btn-secondary">Go to Niches Hunter</a>
  `);
}

export function getResubscribeHTML(success: boolean, errorMessage?: string): string {
  if (success) {
    return basePage('Resubscribed', `
      <div class="icon">🔔</div>
      <h1>Welcome back!</h1>
      <p>You'll receive the weekly API mailing again every Tuesday.<br>Glad to have you back.</p>
      <a href="${SITE_URL}/developers" class="btn btn-primary">Open API Dashboard</a>
    `);
  }

  return basePage('Resubscribe', `
    <div class="icon">⚠️</div>
    <h1 class="error">Oops</h1>
    <p>${errorMessage || 'Something went wrong.'}</p>
    <a href="${SITE_URL}" class="btn btn-secondary">Go to Niches Hunter</a>
  `);
}
