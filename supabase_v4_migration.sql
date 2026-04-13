-- ==========================================
-- STUDYHUB V4 MIGRATIONS
-- Execute este script no console SQL do Supabase
-- ==========================================

-- 1. Tabela para o Plano de Estudos (Smart Calendar)
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  topicos JSONB DEFAULT '[]', -- Armazena array de UUIDs ou NOMES de tópicos
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, data)
);

-- Habilitar RLS
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem gerenciar seus próprios planos"
ON public.study_plans FOR ALL
USING (auth.uid() = user_id);

-- 2. Tabela para Anotações Rápidas do Dashboard
CREATE TABLE IF NOT EXISTS public.user_notes (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  content TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem gerenciar suas próprias notas"
ON public.user_notes FOR ALL
USING (auth.uid() = user_id);

-- ==========================================
-- FIM DAS MIGRATIONS
-- ==========================================
