import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { updateUserStats } from '../lib/gamification';
import { checkAndUnlockAchievements } from '../lib/achievements';

/**
 * Hook centralizado para processar atividades de gamificação.
 * Pode ser chamado após quizzes, simulados ou leitura de conteúdos.
 */
export function useGamification() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();

  const processActivity = useCallback(async (metrics = {}) => {
    if (!user) {
      console.warn('[useGamification] Usuário não autenticado. Ignorando atualização.');
      return null;
    }

    try {
      // 1. Atualizar estatatísticas, XP e Streaks (Global e Local)
      const stats = await updateUserStats(supabase, user.id, currentWorkspaceId, metrics);
      
      // 2. Verificar se novas conquistas foram desbloqueadas (Contexto do Workspace)
      const newlyUnlocked = await checkAndUnlockAchievements(supabase, user.id, currentWorkspaceId, stats);
      
      // 3. Se houver novas conquistas, disparar evento para o componente de Toast
      if (newlyUnlocked && newlyUnlocked.length > 0) {
        window.dispatchEvent(new CustomEvent('show_achievement', { 
          detail: newlyUnlocked 
        }));
      }

      return { stats, newlyUnlocked };
    } catch (err) {
      console.error('[useGamification] Erro ao processar atividade:', err);
      return null;
    }
  }, [user, currentWorkspaceId]);

  return { processActivity };
}
