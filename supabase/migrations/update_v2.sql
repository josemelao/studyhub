-- ==========================================
-- SCRIPT DE ATUALIZAÇÃO DO BANCO (FASE 2)
-- Execute este arquivo no SQL Editor do Supabase
-- ==========================================

-- 1. CRIAR TABELA DE SESSÕES DE PROVA (MODO PROVA)
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concurso_id integer REFERENCES concursos(id), -- Ou UUID se concursos for UUID, ajuste se precisar. O projeto base as vezes não tem uma foreign key strict para concurso. Se essa linha dar erro, você pode deixá-la comentada.
  configuracao JSONB NOT NULL,
  questoes JSONB NOT NULL,
  respostas JSONB DEFAULT '{}',
  iniciada_em TIMESTAMPTZ DEFAULT NOW(),
  finalizada_em TIMESTAMPTZ,
  tempo_gasto_segundos INTEGER,
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada', 'abandonada'))
);

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exam_sessions_own" ON exam_sessions;
CREATE POLICY "exam_sessions_own" ON exam_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 2. CRIAR TABELA DE FAVORITOS
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('conteudo', 'questao')),
  referencia_id UUID NOT NULL,  -- Pode ser string ou UUID dependendo de como as question_ids estão modeladas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tipo, referencia_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites_own" ON favorites;
CREATE POLICY "favorites_own" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- 3. CRIAR TABELA DE ESTATÍSTICAS DO USUÁRIO E GAMIFICAÇÃO
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  streak_atual INTEGER DEFAULT 0,
  streak_max INTEGER DEFAULT 0,
  ultimo_estudo_dia DATE,
  total_questoes_respondidas INTEGER DEFAULT 0,
  total_acertos INTEGER DEFAULT 0,
  conquistas JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_stats_own" ON user_stats;
CREATE POLICY "user_stats_own" ON user_stats
  FOR ALL USING (auth.uid() = user_id);
