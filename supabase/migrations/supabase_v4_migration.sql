-- ==========================================
-- STUDYHUB V4 MIGRATIONS (PRO VERSION)
-- Execute este script no console SQL do Supabase
-- ==========================================

-- 1. Tabela para o Plano de Estudos (Smart Calendar)
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  topicos JSONB DEFAULT '[]',
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, data)
);

-- Adicionar coluna updated_at caso não exista
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_plans' AND column_name='updated_at') THEN
    ALTER TABLE public.study_plans ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso robustas
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios planos" ON public.study_plans;
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
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias notas" ON public.user_notes;
CREATE POLICY "Usuários podem gerenciar suas próprias notas"
ON public.user_notes FOR ALL
USING (auth.uid() = user_id);

-- ==========================================
-- FIM DAS MIGRATIONS
-- ==========================================
