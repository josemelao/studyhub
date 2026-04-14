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
    const xpPerQuestion = 10;
    const xpPerCorrect = 15;
    const xpPerReading = 50;
    
    let initialXP = 0;
    if (metrics.questoes) initialXP += metrics.questoes * xpPerQuestion;
    if (metrics.acertos) initialXP += metrics.acertos * xpPerCorrect;
    if (metrics.leitura) initialXP += xpPerReading;

    const newStats = {
      user_id: userId,
      streak_atual: 1,
      streak_max: 1,
      ultimo_estudo_dia: today,
      total_questoes_respondidas: metrics.questoes || 0,
      total_acertos: metrics.acertos || 0,
      pontos_xp: initialXP,
      conquistas: []
    };
    await supabase.from('user_stats').insert(newStats);
    
    window.dispatchEvent(new CustomEvent('stats_updated', { detail: newStats }));
    return newStats;
  }

  // 3. Atualizar métricas de questões e XP
  const totalQuestions = stats.total_questoes_respondidas + (metrics.questoes || 0);
  const totalCorrect = stats.total_acertos + (metrics.acertos || 0);
  
  const xpPerQuestion = 10;
  const xpPerCorrect = 15;
  const xpPerReading = 50;

  let xpToAdd = 0;
  if (metrics.questoes) xpToAdd += metrics.questoes * xpPerQuestion;
  if (metrics.acertos) xpToAdd += metrics.acertos * xpPerCorrect;
  if (metrics.leitura) xpToAdd += xpPerReading;
  
  const newTotalXP = (stats.pontos_xp || 0) + xpToAdd;

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

  const updatedFields = {
    streak_atual: newStreak,
    streak_max: newMax,
    ultimo_estudo_dia: today,
    total_questoes_respondidas: totalQuestions,
    total_acertos: totalCorrect,
    pontos_xp: newTotalXP,
    updated_at: new Date().toISOString()
  };

  const { data: finalStats, error: updateError } = await supabase
    .from('user_stats')
    .update(updatedFields)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError) throw updateError;

  // Notificar interface
  window.dispatchEvent(new CustomEvent('stats_updated', { detail: finalStats }));

  return finalStats;
}
