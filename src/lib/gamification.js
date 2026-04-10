/**
 * src/lib/gamification.js
 * Lógica para atualização de streaks (sequências) e estatísticas gerais.
 */

export async function updateUserStats(supabase, userId, metrics = {}) {
  const today = new Date().toISOString().split('T')[0];

  // 1. Buscar stats atuais
  const { data: stats, error: fetchError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

  // 2. Se não existir, inicializar
  if (!stats) {
    const newStats = {
      user_id: userId,
      streak_atual: 1,
      streak_max: 1,
      ultimo_estudo_dia: today,
      total_questoes_respondidas: metrics.questoes || 0,
      total_acertos: metrics.acertos || 0,
    };
    await supabase.from('user_stats').insert(newStats);
    return newStats;
  }

  // 3. Atualizar métricas de questões
  const totalQuestions = stats.total_questoes_respondidas + (metrics.questoes || 0);
  const totalCorrect = stats.total_acertos + (metrics.acertos || 0);

  // 4. Lógica de Streak
  let newStreak = stats.streak_atual;
  let newMax = stats.streak_max;

  if (stats.ultimo_estudo_dia !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (stats.ultimo_estudo_dia === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }
  
  newMax = Math.max(newStreak, newMax);

  const updatedStats = {
    streak_atual: newStreak,
    streak_max: newMax,
    ultimo_estudo_dia: today,
    total_questoes_respondidas: totalQuestions,
    total_acertos: totalCorrect,
    updated_at: new Date().toISOString()
  };

  await supabase
    .from('user_stats')
    .update(updatedStats)
    .eq('user_id', userId);

  return { ...stats, ...updatedStats };
}
