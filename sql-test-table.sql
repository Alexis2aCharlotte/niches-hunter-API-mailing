-- =============================================
-- TABLE TEST : api_developers_test
-- Copie de api_developers pour les tests de mailing
-- Ne touche PAS à la vraie table api_developers
-- =============================================

CREATE TABLE api_developers_test (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  newsletter_opted_out BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'test',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pas de RLS sur la table de test (service_role only)
ALTER TABLE api_developers_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to api_developers_test"
  ON api_developers_test FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- INSERT TEST DATA
-- Mets ton email ici pour recevoir les mails de test
-- user_id peut être un UUID fictif pour les tests
-- =============================================

INSERT INTO api_developers_test (user_id, email, name, source) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ton-email@example.com', 'Test Dev', 'test');
