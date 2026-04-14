/**
 * Calcula o nível atual baseado no XP total.
 * Fórmula: cada 1000 XP = 1 Nível.
 */
export function calculateLevel(xp = 0) {
  return Math.floor(xp / 1000) + 1;
}

/**
 * Calcula o progresso percentual para o próximo nível (0 a 100).
 */
export function calculateProgress(xp = 0) {
  return (xp % 1000) / 10;
}

/**
 * Retorna quanto XP falta para o próximo nível.
 */
export function xpToNextLevel(xp = 0) {
  return 1000 - (xp % 1000);
}
