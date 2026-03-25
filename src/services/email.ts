import { Resend } from 'resend';
import { generateApiMailingHTML } from '../templates/api-mailing';
import { WeeklyContent } from './openai';
import { EnrichedDeveloper } from './supabase';

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = 'Niches Hunter API <api@nicheshunter.app>';
const REPLY_TO = 'contact@nicheshunter.app';
const SITE_URL = process.env.SITE_URL || 'https://nicheshunter.app';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send personalized API mailing to all developers (sequential, 600ms delay)
 */
export async function sendApiMailingBatch(
  developers: EnrichedDeveloper[],
  content: WeeklyContent
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  console.log(`📧 Sending mailing to ${developers.length} developers (sequential, 600ms delay)...`);

  for (let i = 0; i < developers.length; i++) {
    const dev = developers[i];

    const unsubscribeUrl = `${SITE_URL}/api-unsubscribe?email=${encodeURIComponent(dev.email)}`;
    
    const html = generateApiMailingHTML({
      content,
      developerName: dev.name,
      balanceCents: dev.balance_cents,
      callsThisMonth: dev.calls_this_month,
      lastCallDate: dev.last_call_date,
      unsubscribeUrl,
    });

    try {
      await getResendClient().emails.send({
        from: FROM_EMAIL,
        to: dev.email,
        reply_to: REPLY_TO,
        subject: `⚡ ${content.subject}`,
        html,
      });
      success++;
      console.log(`✅ [${i + 1}/${developers.length}] Sent to ${dev.email}`);
    } catch (err: any) {
      console.error(`❌ [${i + 1}/${developers.length}] Failed to send to ${dev.email}:`, err?.message || err);
      failed++;
    }

    if (i < developers.length - 1) {
      await delay(600);
    }
  }

  console.log(`📊 Mailing sent: ${success} success, ${failed} failed`);
  return { success, failed };
}
