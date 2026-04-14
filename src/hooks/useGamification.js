import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { updateUserStats } from '../lib/gamification';
import { checkAndUnlockAchievements } from '../lib/achievements';

/**
 * Hook centralizado para processar atividades de gamificação.
 * Pode ser chamado após quizzes, simulados ou leitura de conteúdos.
 */
export function useGamification() {
  const { user } = useAuth();

  const processActivity = async (metrics = {}) => {
    if (!user) {
      console.warn('[useGamification] Usuário não autenticado. Ignorando atualização.');
      return null;
    }

    try {
      // 1. Atualizar estatatísticas, XP e Streaks no banco
      const stats = await updateUserStats(supabase, user.id, metrics);
      
      // 2. Verificar se novas conquistas foram desbloqueadas com base nos novos stats
      const newlyUnlocked = await checkAndUnlockAchievements(supabase, user.id, stats);
      
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
  };

  return { processActivity };
}
