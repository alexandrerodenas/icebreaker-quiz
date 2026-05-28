-- Icebreaker Quiz — Supabase schema
-- Exécute ce SQL dans l'éditeur SQL de Supabase Dashboard

CREATE TABLE IF NOT EXISTS game_states (
  game_id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes par updated_at (cleanup éventuel)
CREATE INDEX IF NOT EXISTS idx_game_states_updated_at ON game_states(updated_at);
