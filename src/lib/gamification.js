/**
 * src/lib/gamification.js
 * Lógica Híbrida: Streaks/XP Globais e Performance Local por Workspace.
 */

export async function updateUserStats(supabase, userId, workspaceId, metrics = {}) {
  const today = new Date().toISOString().split('T')[0];
  const xpPerQuestion = 10;
  const xpPerCorrect = 15;
  const xpPerReading = 50;

  // 1. ATUALIZAÇÃO GLOBAL (user_stats)
  let { data: globalStats, error: gFetchError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (gFetchError && gFetchError.code !== 'PGRST116') throw gFetchError;

  let xpToAdd = 0;
  if (metrics.questoes) xpToAdd += metrics.questoes * xpPerQuestion;
  if (metrics.acertos) xpToAdd += metrics.acertos * xpPerCorrect;
  if (metrics.leitura) xpToAdd += xpPerReading;

  if (!globalStats) {
    globalStats = {
      user_id: userId,
      streak_atual: 1,
      streak_max: 1,
      ultimo_estudo_dia: today,
      pontos_xp: xpToAdd,
    };
    
    // Usamos upsert com onConflict para garantir que, se outro processo criou a linha 
    // entre nosso fetch e este insert, não tenhamos erro 409.
    const { data: upsertData, error: uError } = await supabase
      .from('user_stats')
      .upsert(globalStats, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (uError) throw uError;
    globalStats = upsertData;
  } else {
    // Cálculo de Streak Global
    let newStreak = globalStats.streak_atual;
    let newMax = globalStats.streak_max;

    if (globalStats.ultimo_estudo_dia !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (globalStats.ultimo_estudo_dia === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }
    newMax = Math.max(newStreak, newMax);

    const { data: updatedGlobal, error: updateError } = await supabase
      .from('user_stats')
      .update({
        streak_atual: newStreak,
        streak_max: newMax,
        ultimo_estudo_dia: today,
        pontos_xp: (globalStats.pontos_xp || 0) + xpToAdd,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    globalStats = updatedGlobal;
  }

  // 2. ATUALIZAÇÃO LOCAL (workspace_stats)
  if (workspaceId) {
    let { data: localStats, error: lFetchError } = await supabase
      .from('workspace_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (lFetchError && lFetchError.code !== 'PGRST116') throw lFetchError;

    if (!localStats) {
      localStats = {
        user_id: userId,
        workspace_id: workspaceId,
        total_questoes_respondidas: metrics.questoes || 0,
        total_acertos: metrics.acertos || 0,
        conquistas: []
      };
      
      const { data: upsertLocal, error: ulError } = await supabase
        .from('workspace_stats')
        .upsert(localStats, { onConflict: 'user_id, workspace_id' })
        .select()
        .maybeSingle();

      if (ulError) throw ulError;
      localStats = upsertLocal;
    } else {
      const { data: updatedLocal, error: updateLocalError } = await supabase
        .from('workspace_stats')
        .update({
          total_questoes_respondidas: localStats.total_questoes_respondidas + (metrics.questoes || 0),
          total_acertos: localStats.total_acertos + (metrics.acertos || 0),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .select()
        .maybeSingle();

      if (updateLocalError) throw updateLocalError;
      localStats = updatedLocal;
    }

    // Mesclar para retorno e notificação
    const mergedStats = { ...globalStats, ...localStats };
    window.dispatchEvent(new CustomEvent('stats_updated', { detail: mergedStats }));
    return mergedStats;
  }

  window.dispatchEvent(new CustomEvent('stats_updated', { detail: globalStats }));
  return globalStats;
}
