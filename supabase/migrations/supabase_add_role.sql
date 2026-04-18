-- ==========================================
-- STUDYHUB - ADICIONAR SISTEMA DE ROLES
-- Execute este script no console SQL do Supabase
-- ==========================================

-- 1. Adicionar coluna 'role' na tabela de perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 2. Definir o administrador inicial (José Tadeu)
-- Buscamos pelo e-mail na tabela auth.users para encontrar o ID correto
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'jose.tadeu.junior@gmail.com'
);

-- ==========================================
-- FIM DO SCRIPT
-- ==========================================
