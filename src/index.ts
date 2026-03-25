import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateApiMailing } from './generate';
import { unsubscribeDeveloper, resubscribeDeveloper } from './services/supabase';
import { getUnsubscribeHTML, getResubscribeHTML } from './templates/unsubscribe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// ─── Health ──────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Niches Hunter API Mailing',
    description: 'Weekly engagement mailing for API developers',
    timestamp: new Date().toISOString()
  });
});

// ─── Generate (CRON target) ─────────────────────────────

app.post('/generate', async (req, res) => {
  console.log('📧 Manual API mailing generation triggered');
  
  res.json({ 
    success: true, 
    message: 'API mailing generation started...' 
  });

  generateApiMailing().catch(err => {
    console.error('❌ API mailing generation failed:', err);
  });
});

// ─── Unsubscribe (GET = browser click from email) ───────

app.get('/api-unsubscribe', async (req, res) => {
  const email = req.query.email as string;

  if (!email) {
    res.status(400).send(getUnsubscribeHTML(false, 'No email provided.'));
    return;
  }

  try {
    const success = await unsubscribeDeveloper(email);
    if (success) {
      console.log(`🔕 Unsubscribed: ${email}`);
      res.send(getUnsubscribeHTML(true));
    } else {
      res.send(getUnsubscribeHTML(false, 'Email not found or already unsubscribed.'));
    }
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).send(getUnsubscribeHTML(false, 'Something went wrong. Please try again.'));
  }
});

// ─── Resubscribe (GET = link from unsubscribe page) ─────

app.get('/api-resubscribe', async (req, res) => {
  const email = req.query.email as string;

  if (!email) {
    res.status(400).send(getResubscribeHTML(false, 'No email provided.'));
    return;
  }

  try {
    const success = await resubscribeDeveloper(email);
    if (success) {
      console.log(`🔔 Resubscribed: ${email}`);
      res.send(getResubscribeHTML(true));
    } else {
      res.send(getResubscribeHTML(false, 'Email not found or already subscribed.'));
    }
  } catch (error) {
    console.error('Resubscribe error:', error);
    res.status(500).send(getResubscribeHTML(false, 'Something went wrong. Please try again.'));
  }
});

// ─── Unsubscribe API (POST = programmatic) ──────────────

app.post('/api-unsubscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, error: 'Email is required' });
    return;
  }

  try {
    const success = await unsubscribeDeveloper(email);
    res.json({ success, message: success ? 'Unsubscribed' : 'Email not found or already unsubscribed' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// ─── Start ──────────────────────────────────────────────

const isTestMode = process.env.TEST_MODE === 'true';

app.listen(PORT, () => {
  console.log(`\n⚡ Niches Hunter API Mailing Service`);
  console.log(`═══════════════════════════════════════════`);
  if (isTestMode) {
    console.log(`🧪 MODE: TEST (api_developers_test)`);
  } else {
    console.log(`🚀 MODE: PRODUCTION (api_developers)`);
  }
  console.log(`📍 Port: ${PORT}`);
  console.log(`⏰ CRON géré par Railway (mardi 10h00)`);
  console.log(`📍 Health:        GET  /health`);
  console.log(`📍 Generate:      POST /generate`);
  console.log(`📍 Unsubscribe:   GET  /api-unsubscribe?email=xxx`);
  console.log(`📍 Resubscribe:   GET  /api-resubscribe?email=xxx`);
  console.log(`═══════════════════════════════════════════\n`);
});
