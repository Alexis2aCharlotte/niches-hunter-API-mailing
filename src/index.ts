import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateApiMailing } from './generate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Niches Hunter API Mailing',
    description: 'Weekly engagement mailing for API developers',
    timestamp: new Date().toISOString()
  });
});

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

app.listen(PORT, () => {
  console.log(`\n⚡ Niches Hunter API Mailing Service`);
  console.log(`═══════════════════════════════════════════`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`⏰ CRON géré par Railway (mardi 10h00)`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 Generate: POST http://localhost:${PORT}/generate`);
  console.log(`═══════════════════════════════════════════\n`);
});
