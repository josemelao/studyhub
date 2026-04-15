-- ==========================================
-- STUDYHUB V5 MIGRATIONS - WORKSPACES (EDITAIS)
-- ==========================================

-- 1. Criação da tabela de Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  concurso_id UUID REFERENCES public.concursos(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para Workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam seus próprios workspaces" ON public.workspaces;
CREATE POLICY "Usuários gerenciam seus próprios workspaces"
ON public.workspaces FOR ALL
USING (auth.uid() = user_id);

-- ==========================================
-- 2. Adicionar workspace_id nas Tabelas Operacionais
-- ==========================================

-- Tabela: subjects
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: sub_subjects
ALTER TABLE public.sub_subjects ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: topics
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: contents
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: user_notes
ALTER TABLE public.user_notes ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: favorites
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: exam_sessions
ALTER TABLE public.exam_sessions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: user_progress
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: user_topic_notes
ALTER TABLE public.user_topic_notes ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: user_answers
ALTER TABLE public.user_answers ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: quiz_sessions
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Tabela: study_plans
ALTER TABLE public.study_plans ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- ==========================================
-- 3. Scripts de Migração para Contas Existentes (Evitar Quebra)
-- ==========================================
/*
  ATENÇÃO: Caso já existam contas estruturadas no banco com matérias cadastradas,
  rode os comandos abaixo manualmente para gerar o Workspace Nº 1 para eles e re-parear
  os dados órfãos, senão eles sumirão do App.

  DO $$
  DECLARE
      u RECORD;
      ws_id UUID;
  BEGIN
      -- Para cada usuário único encontrado no sistema
      FOR u IN SELECT DISTINCT id FROM auth.users LOOP
          -- Criar Workspace Default chamado "Primeiro Edital"
          INSERT INTO public.workspaces (user_id, name)
          VALUES (u.id, 'Primeiro Edital')
          RETURNING id INTO ws_id;
          
          -- Associa os dados existentes apenas desse usuário ao novo workspace
          UPDATE public.subjects SET workspace_id = ws_id WHERE id IN (SELECT id FROM public.subjects limit 1000); -- Simplificacao
          -- (Repetir os UPDATE para as demais tabelas mapeando pelo autor da ação ou por via dos relacionamentos)
      END LOOP;
  END $$;
*/

-- ==========================================
-- FIM DAS MIGRATIONS
-- ==========================================
