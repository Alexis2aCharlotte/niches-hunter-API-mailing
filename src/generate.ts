/**
 * API Developer Weekly Mailing Generator
 * 
 * WORKFLOW:
 * 1. Get 1 trending niche from 'niches' table (best score last 7 days)
 * 2. Generate AI content (niche highlight + API tip + engagement message)
 * 3. Get all enriched developers in 3 queries (devs + wallets + stats)
 * 4. Send personalized emails via Resend (sequential, 600ms delay)
 * 5. Notify Telegram with recap
 */

import dotenv from 'dotenv';
dotenv.config();

import { getTrendingNiche, getEnrichedDevelopers } from './services/supabase';
import { generateWeeklyContent } from './services/openai';
import { sendApiMailingBatch } from './services/email';
import { notifyTelegram } from './services/telegram';

export async function generateApiMailing(): Promise<void> {
  console.log('');
  console.log('═'.repeat(60));
  console.log('⚡ NICHES HUNTER — API Developer Weekly Mailing');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // Step 1: Get trending niche
    console.log('📥 Step 1: Fetching trending niche (best score, last 7 days)...');
    const niche = await getTrendingNiche();
    
    if (!niche) {
      console.log('⚠️  No niche found. Skipping mailing.');
      await notifyTelegram('⚠️ API Mailing skipped: No niche available');
      return;
    }
    console.log(`   📋 Niche: ${niche.title} (Score: ${niche.score})`);
    console.log('');

    // Step 2: Generate AI content
    console.log('🤖 Step 2: Generating weekly content with AI...');
    const content = await generateWeeklyContent(niche);
    console.log(`   ✅ Content generated (subject: "${content.subject}")`);
    console.log('');

    // Step 3: Get all enriched developers (3 queries total: devs + wallets + stats)
    console.log('👥 Step 3: Fetching developers with wallets & stats (batch)...');
    const developers = await getEnrichedDevelopers();
    console.log(`   ✅ Found ${developers.length} enriched developers`);

    if (developers.length > 0) {
      const avgBalance = developers.reduce((s, d) => s + d.balance_cents, 0) / developers.length;
      const activeThisMonth = developers.filter(d => d.calls_this_month > 0).length;
      console.log(`   💰 Avg balance: €${(avgBalance / 100).toFixed(2)}`);
      console.log(`   📊 Active this month: ${activeThisMonth}/${developers.length}`);
    }
    console.log('');

    if (developers.length === 0) {
      console.log('⚠️  No developers to send to. Skipping.');
      await notifyTelegram('⚠️ API Mailing: No active developers found');
      return;
    }

    // Step 4: Send personalized emails
    console.log('📧 Step 4: Sending personalized emails...');
    const { success, failed } = await sendApiMailingBatch(developers, content);
    console.log(`   ✅ Sent: ${success} | ❌ Failed: ${failed}`);
    console.log('');

    // Step 5: Telegram notification
    console.log('📱 Step 5: Sending Telegram notification...');
    const activeThisMonth = developers.filter(d => d.calls_this_month > 0).length;
    const lowBalance = developers.filter(d => d.balance_cents < 500).length;

    const telegramMessage = `⚡ API Developer Mailing Sent!

📌 ${content.subject}

🎯 Niche of the week:
• ${niche.title} (Score: ${niche.score}/100)

📊 Stats:
• Developers: ${developers.length}
• Active this month: ${activeThisMonth}
• Low balance (<€5): ${lowBalance}
• Sent: ${success}
• Failed: ${failed}

${failed > 0 ? '⚠️ Check logs for failed emails' : '✅ All sent!'}`;

    await notifyTelegram(telegramMessage);
    console.log('   ✅ Telegram notification sent');

    console.log('');
    console.log('═'.repeat(60));
    console.log('🎉 API Mailing generation complete!');
    console.log('═'.repeat(60));
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error);
    await notifyTelegram(`❌ API Developer Mailing FAILED!\n\nError: ${error}`);
    throw error;
  }
}

if (require.main === module) {
  generateApiMailing()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
