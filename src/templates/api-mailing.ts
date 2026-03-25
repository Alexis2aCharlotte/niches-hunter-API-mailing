import { WeeklyContent } from '../services/openai';

const SITE_URL = process.env.SITE_URL || 'https://nicheshunter.app';

interface MailingParams {
  content: WeeklyContent;
  developerName: string | null;
  balanceCents: number;
  callsThisMonth: number;
  lastCallDate: string | null;
  unsubscribeUrl: string;
}

function formatBalance(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function formatLastCall(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function generateApiMailingHTML(params: MailingParams): string {
  const { content, developerName, balanceCents, callsThisMonth, lastCallDate, unsubscribeUrl } = params;
  const nicheUrl = `${SITE_URL}/niches/${content.nicheDisplayCode}`;
  const devLoginUrl = 'https://nicheshunter.app/developer';
  const balanceDisplay = formatBalance(balanceCents);
  const lastCallDisplay = formatLastCall(lastCallDate);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>Niches Hunter API - Weekly Brief</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:32px 16px;background-color:#0a0a0a;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" width="100%" border="0" style="max-width:560px;">

          <!-- Logo Badge -->
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <div style="display:inline-block;background:#1a1a2e;padding:10px 20px;border-radius:100px;border:1px solid #00CC6A33;">
                <span style="letter-spacing:2px;font-size:12px;font-weight:700;color:#00CC6A;">
                  ⚡ NICHES HUNTER API
                </span>
              </div>
            </td>
          </tr>

          <!-- Header Card -->
          <tr>
            <td style="padding-bottom:24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#111;border-radius:20px;overflow:hidden;border:1px solid #222;">
                <tr>
                  <td style="padding:32px 28px;text-align:center;">
                    <div style="font-size:13px;color:#666;margin-bottom:12px;">${today}</div>
                    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;line-height:1.3;">
                      Hey fellow dev! 👋
                    </h1>
                    <p style="margin:0;font-size:15px;color:#888;line-height:1.6;">
                      ${content.engagementMessage}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Your Stats Card -->
          <tr>
            <td style="padding-bottom:24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#111;border-radius:20px;overflow:hidden;border:1px solid #222;">
                <tr>
                  <td style="padding:24px 28px;">
                    <div style="font-size:11px;font-weight:700;color:#00CC6A;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">📊 Your Dashboard</div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="33%" style="text-align:center;padding:12px 0;">
                          <div style="font-size:24px;font-weight:800;color:#fff;">${balanceDisplay}</div>
                          <div style="font-size:11px;color:#666;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Balance</div>
                        </td>
                        <td width="33%" style="text-align:center;padding:12px 0;border-left:1px solid #222;border-right:1px solid #222;">
                          <div style="font-size:24px;font-weight:800;color:#fff;">${callsThisMonth}</div>
                          <div style="font-size:11px;color:#666;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Calls this month</div>
                        </td>
                        <td width="33%" style="text-align:center;padding:12px 0;">
                          <div style="font-size:14px;font-weight:700;color:${lastCallDate ? '#fff' : '#ff6b6b'};">${lastCallDisplay}</div>
                          <div style="font-size:11px;color:#666;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Last API call</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Niche of the Week -->
          <tr>
            <td style="padding-bottom:24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#111;border-radius:20px;overflow:hidden;border:1px solid #222;">
                <!-- Niche Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#00CC6A,#00995C);padding:24px 28px;">
                    <div style="font-size:11px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">🔥 Niche of the Week • Score ${content.nicheScore}/100</div>
                    <div style="font-size:22px;font-weight:800;color:#fff;">${content.nicheEmoji} ${content.nicheTitle}</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">${content.nicheCategory}</div>
                  </td>
                </tr>
                <!-- Niche Body -->
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 20px;font-size:15px;color:#ccc;line-height:1.7;">${content.nicheHighlight}</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${nicheUrl}" style="display:inline-block;background:#00CC6A;color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;">
                            Explore this niche →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- API Tip of the Week -->
          <tr>
            <td style="padding-bottom:24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#111;border-radius:20px;overflow:hidden;border:1px solid #222;">
                <tr>
                  <td style="padding:24px 28px;">
                    <div style="font-size:11px;font-weight:700;color:#FFD700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">💡 API Tip of the Week</div>
                    <p style="margin:0 0 20px;font-size:15px;color:#ccc;line-height:1.7;">${content.apiTip}</p>
                    <a href="${devLoginUrl}" style="color:#00CC6A;text-decoration:none;font-size:14px;font-weight:600;">
                      Open API Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA: Top Up -->
          ${balanceCents < 500 ? `
          <tr>
            <td style="padding-bottom:24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#1a1a0a;border-radius:20px;overflow:hidden;border:1px solid #FFD70033;">
                <tr>
                  <td style="padding:24px 28px;text-align:center;">
                    <div style="font-size:15px;color:#FFD700;font-weight:600;margin-bottom:8px;">⚠️ Low balance: ${balanceDisplay}</div>
                    <p style="margin:0 0 16px;font-size:14px;color:#999;">Top up to keep using the API without interruption.</p>
                    <a href="${devLoginUrl}" style="display:inline-block;background:#FFD700;color:#000;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;">
                      Top Up Credits →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding:16px;">
              <p style="margin:0 0 8px;font-size:14px;color:#666;">
                Happy building ⚡
              </p>
              <a href="${SITE_URL}" style="text-decoration:none;font-size:13px;font-weight:600;color:#00CC6A;">
                nicheshunter.app
              </a>
              <p style="margin:12px 0 0;font-size:11px;color:#555;">
                You're receiving this because you have an API account on Niches Hunter.
              </p>
              <p style="margin:8px 0 0;">
                <a href="${unsubscribeUrl}" style="color:#555;text-decoration:underline;font-size:11px;">Unsubscribe from emails</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
