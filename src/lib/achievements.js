/**
 * src/lib/achievements.js
 */

export const ACHIEVEMENTS = [
  {
    id: 'first_study',
    titulo: 'Primeiro passo',
    descricao: 'Estudou pela primeira vez no StudyHub',
    icone: '🎯',
    condicao: (stats) => stats.total_questoes_respondidas >= 1 || stats.streak_atual >= 1
  },
  {
    id: 'streak_3',
    titulo: 'Consistência',
    descricao: '3 dias seguidos de estudo',
    icone: '🔥',
    condicao: (stats) => stats.streak_atual >= 3
  },
  {
    id: 'streak_7',
    titulo: 'Semana Perfeita',
    descricao: '7 dias seguidos de estudo',
    icone: '⚡',
    condicao: (stats) => stats.streak_atual >= 7
  },
  {
    id: 'questions_50',
    titulo: 'Em treinamento',
    descricao: '50 questões respondidas',
    icone: '📝',
    condicao: (stats) => stats.total_questoes_respondidas >= 50
  },
  {
    id: 'questions_200',
    titulo: 'Veterano',
    descricao: '200 questões respondidas',
    icone: '🎓',
    condicao: (stats) => stats.total_questoes_respondidas >= 200
  },
  {
    id: 'accuracy_80',
    titulo: 'Precisão Cirúrgica',
    descricao: 'Taxa de acerto acima de 80% (mín. 20 questões)',
    icone: '🎯',
    condicao: (stats) => 
      stats.total_questoes_respondidas >= 20 && 
      (stats.total_acertos / stats.total_questoes_respondidas) >= 0.8
  }
];

export async function checkAndUnlockAchievements(supabase, userId, workspaceId, stats) {
  const currentUnlocked = stats.conquistas || [];
  const unlockedIds = currentUnlocked.map(c => c.id);
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedIds.includes(achievement.id) && achievement.condicao(stats)) {
      newlyUnlocked.push({
        id: achievement.id,
        unlocked_at: new Date().toISOString(),
        titulo: achievement.titulo,
        icone: achievement.icone
      });
    }
  }

  if (newlyUnlocked.length > 0 && workspaceId) {
    await supabase.from('workspace_stats').update({
      conquistas: [...currentUnlocked, ...newlyUnlocked]
    })
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId);
  }

  return newlyUnlocked;
}
