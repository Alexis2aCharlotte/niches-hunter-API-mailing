import OpenAI from 'openai';
import { Niche } from './supabase';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function safeJsonParse(value: any, fallback: any = {}): any {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export interface WeeklyContent {
  subject: string;
  nicheEmoji: string;
  nicheTitle: string;
  nicheCategory: string;
  nicheScore: number;
  nicheHighlight: string;
  nicheDisplayCode: string;
  apiTip: string;
  engagementMessage: string;
}

/**
 * Generate weekly mailing content using OpenAI
 */
export async function generateWeeklyContent(niche: Niche): Promise<WeeklyContent> {
  const stats = safeJsonParse(niche.stats, {});
  const marketAnalysis = safeJsonParse(niche.market_analysis, {});

  const context = `
NICHE: ${niche.title}
CATEGORY: ${niche.category}
SCORE: ${niche.score}/100
MARKET SIZE: ${marketAnalysis.totalMarketSize || 'N/A'}
GROWTH RATE: ${marketAnalysis.growthRate || 'N/A'}
OPPORTUNITY: ${niche.opportunity}
GAP: ${niche.gap}
RECOMMENDED MOVE: ${niche.move}
`;

  const prompt = `You are writing a weekly engagement email for developers using the Niches Hunter API.
The goal is to give them value and encourage them to use the API more.

Based on this trending niche data, generate content for the email in JSON format:

${context}

Return a JSON object with:
{
  "subject": "Catchy email subject line (max 60 chars, no emoji - we add one automatically)",
  "nicheEmoji": "Single relevant emoji for this niche",
  "nicheHighlight": "2-3 sentences summarizing why this niche is hot right now. Be specific with numbers. Make them want to explore it via the API.",
  "apiTip": "A practical tip for using the Niches Hunter API (e.g. a useful endpoint, a filtering trick, a way to combine data). Keep it concise and actionable, 2-3 sentences.",
  "engagementMessage": "A short motivational message (1-2 sentences) encouraging the dev to come back and build something. Direct, punchy tone."
}

Rules:
- Be CONCISE and PUNCHY. No fluff.
- Write in English
- The API tip should feel genuinely useful, not generic
- The engagement message should create urgency without being pushy`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are a concise developer marketing copywriter. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 400
    });

    const raw = response.choices[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      subject: parsed.subject || `Trending: ${niche.title}`,
      nicheEmoji: parsed.nicheEmoji || '🎯',
      nicheTitle: niche.title,
      nicheCategory: niche.category,
      nicheScore: niche.score,
      nicheHighlight: parsed.nicheHighlight || niche.opportunity,
      nicheDisplayCode: niche.display_code,
      apiTip: parsed.apiTip || 'Use the /niches endpoint to discover new opportunities every day.',
      engagementMessage: parsed.engagementMessage || 'Your next big idea is one API call away.',
    };
  } catch (error) {
    console.error('OpenAI generation failed, using fallback:', error);
    return {
      subject: `Trending: ${niche.title}`,
      nicheEmoji: '🎯',
      nicheTitle: niche.title,
      nicheCategory: niche.category,
      nicheScore: niche.score,
      nicheHighlight: niche.opportunity,
      nicheDisplayCode: niche.display_code,
      apiTip: 'Use the /niches endpoint with filters to discover opportunities tailored to your stack.',
      engagementMessage: 'Your next big idea is one API call away.',
    };
  }
}
