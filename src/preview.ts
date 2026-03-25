/**
 * Preview script — Generates the HTML locally without sending emails
 */

import dotenv from 'dotenv';
dotenv.config();

import { getTrendingNiche } from './services/supabase';
import { generateWeeklyContent } from './services/openai';
import { generateApiMailingHTML } from './templates/api-mailing';
import * as fs from 'fs';

async function preview() {
  console.log('📥 Fetching trending niche (best score, last 7 days)...');
  const niche = await getTrendingNiche();
  
  if (!niche) {
    console.log('⚠️ No niche found');
    return;
  }
  console.log(`   📋 ${niche.title} (Score: ${niche.score})`);

  console.log('🤖 Generating weekly content...');
  const content = await generateWeeklyContent(niche);
  console.log(`   ✅ Subject: "${content.subject}"`);
  
  console.log('🎨 Generating preview HTML (mock dev data)...');
  const html = generateApiMailingHTML({
    content,
    developerName: 'Alex',
    balanceCents: 1250,
    callsThisMonth: 42,
    lastCallDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    unsubscribeUrl: 'https://nicheshunter.app/api-unsubscribe?email=test@example.com',
  });

  // Also generate a "low balance" version
  const htmlLowBalance = generateApiMailingHTML({
    content,
    developerName: 'John',
    balanceCents: 150,
    callsThisMonth: 0,
    lastCallDate: null,
    unsubscribeUrl: 'https://nicheshunter.app/api-unsubscribe?email=test2@example.com',
  });
  
  fs.writeFileSync('preview.html', html);
  fs.writeFileSync('preview-low-balance.html', htmlLowBalance);
  console.log('✅ Saved preview.html (normal) + preview-low-balance.html (low balance alert)');
  console.log('   Open them in your browser!');
}

preview().catch(console.error);
