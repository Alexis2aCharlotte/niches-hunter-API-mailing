import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

// ─── Test Mode ───────────────────────────────────────────

const isTestMode = process.env.TEST_MODE === 'true';

function getDevsTable(): string {
  const table = isTestMode ? 'api_developers_test' : 'api_developers';
  return table;
}

function logTestMode(): void {
  if (isTestMode) {
    console.log('   ⚠️  TEST MODE — using api_developers_test');
  }
}

// ─── Types ───────────────────────────────────────────────

export interface ApiDeveloper {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  newsletter_opted_out: boolean;
  source: string;
  created_at: string;
}

export interface ApiWallet {
  id: string;
  user_id: string;
  balance_cents: number;
  total_spent_cents: number;
  bonus_claimed: boolean;
}

export interface Niche {
  id: string;
  title: string;
  category: string;
  tags: string[];
  score: number;
  opportunity: string;
  gap: string;
  move: string;
  stats: string;
  market_analysis: string;
  key_learnings: string[];
  improvements: string[];
  risks: string[];
  tech_stack: string[];
  trending: string;
  display_code: string;
  created_at: string;
}

export interface EnrichedDeveloper {
  email: string;
  name: string | null;
  user_id: string;
  balance_cents: number;
  total_spent_cents: number;
  calls_this_month: number;
  last_call_date: string | null;
}

// ─── Queries ─────────────────────────────────────────────

/**
 * Get all active API developers who haven't opted out of the newsletter
 */
export async function getActiveApiDevelopers(): Promise<ApiDeveloper[]> {
  const table = getDevsTable();
  logTestMode();
  console.log(`   📋 Using table: ${table}`);

  const { data, error } = await getSupabase()
    .from(table)
    .select('*')
    .eq('is_active', true)
    .eq('newsletter_opted_out', false);

  if (error) {
    console.error('Error fetching API developers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get the best trending niche from the last 7 days (highest score).
 * Falls back to most recent niche if none found in the last 7 days.
 */
export async function getTrendingNiche(): Promise<Niche | null> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Best scored niche from the last 7 days
  const { data, error } = await getSupabase()
    .from('niches')
    .select('*')
    .gte('created_at', sevenDaysAgo)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching trending niche:', error);
    return null;
  }

  if (data) return data;

  // Fallback: most recent niche overall
  console.log('   ⚠️ No niche in last 7 days, falling back to most recent');
  const { data: fallback } = await getSupabase()
    .from('niches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return fallback ?? null;
}

/**
 * Batch fetch all wallets for a list of user IDs (1 query instead of N)
 */
export async function getWalletsByUserIds(userIds: string[]): Promise<Map<string, ApiWallet>> {
  const map = new Map<string, ApiWallet>();
  if (userIds.length === 0) return map;

  const { data, error } = await getSupabase()
    .from('api_wallets')
    .select('*')
    .in('user_id', userIds);

  if (error) {
    console.error('Error batch fetching wallets:', error);
    return map;
  }

  for (const wallet of data || []) {
    map.set(wallet.user_id, wallet);
  }

  return map;
}

/**
 * Batch fetch usage stats for all developers (2 queries instead of 2N).
 * Returns a Map<user_id, { callsThisMonth, lastCallDate }>
 */
export async function getStatsByUserIds(userIds: string[]): Promise<Map<string, {
  callsThisMonth: number;
  lastCallDate: string | null;
}>> {
  const map = new Map<string, { callsThisMonth: number; lastCallDate: string | null }>();
  
  // Initialize all users with defaults
  for (const uid of userIds) {
    map.set(uid, { callsThisMonth: 0, lastCallDate: null });
  }

  if (userIds.length === 0) return map;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Query 1: All calls this month for these users
  const { data: monthlyCalls, error: monthlyError } = await getSupabase()
    .from('api_calls')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .gte('created_at', firstOfMonth);

  if (monthlyError) {
    console.error('Error fetching monthly calls:', monthlyError);
    return map;
  }

  // Count calls per user + track latest call date
  for (const call of monthlyCalls || []) {
    const entry = map.get(call.user_id)!;
    entry.callsThisMonth++;
  }

  // Query 2: Last call per user (all time, not just this month)
  const { data: lastCalls, error: lastError } = await getSupabase()
    .from('api_calls')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  if (lastError) {
    console.error('Error fetching last calls:', lastError);
    return map;
  }

  // Only keep the first (most recent) per user
  const seen = new Set<string>();
  for (const call of lastCalls || []) {
    if (!seen.has(call.user_id)) {
      seen.add(call.user_id);
      map.get(call.user_id)!.lastCallDate = call.created_at;
    }
  }

  return map;
}

/**
 * Main function: get all developers enriched with wallet + stats in 3 queries total
 * (instead of 2N+1 queries in the naive approach)
 */
export async function getEnrichedDevelopers(): Promise<EnrichedDeveloper[]> {
  // 1 query: active devs
  const developers = await getActiveApiDevelopers();
  if (developers.length === 0) return [];

  const userIds = developers.map(d => d.user_id);

  // 2 queries in parallel: wallets + stats
  const [wallets, stats] = await Promise.all([
    getWalletsByUserIds(userIds),
    getStatsByUserIds(userIds),
  ]);

  return developers.map(dev => {
    const wallet = wallets.get(dev.user_id);
    const devStats = stats.get(dev.user_id);

    return {
      email: dev.email,
      name: dev.name,
      user_id: dev.user_id,
      balance_cents: wallet?.balance_cents ?? 0,
      total_spent_cents: wallet?.total_spent_cents ?? 0,
      calls_this_month: devStats?.callsThisMonth ?? 0,
      last_call_date: devStats?.lastCallDate ?? null,
    };
  });
}

// ─── Unsubscribe ─────────────────────────────────────────

/**
 * Opt-out a developer from the weekly mailing.
 * Sets newsletter_opted_out = true. The API account stays active.
 * Returns true if the developer was found and updated.
 */
export async function unsubscribeDeveloper(email: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from(getDevsTable())
    .update({ newsletter_opted_out: true, updated_at: new Date().toISOString() })
    .eq('email', email)
    .eq('newsletter_opted_out', false)
    .select('id');

  if (error) {
    console.error('Error unsubscribing developer:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Re-subscribe a developer to the weekly mailing.
 */
export async function resubscribeDeveloper(email: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from(getDevsTable())
    .update({ newsletter_opted_out: false, updated_at: new Date().toISOString() })
    .eq('email', email)
    .eq('newsletter_opted_out', true)
    .select('id');

  if (error) {
    console.error('Error resubscribing developer:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}
