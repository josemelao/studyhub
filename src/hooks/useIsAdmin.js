import { useAuth } from './useAuth';

/**
 * Hook que verifica se o usuário atual é o administrador do sistema.
 * Apenas o admin pode acessar a tela de Gerenciar Conteúdo.
 */
export function useIsAdmin() {
  const { profile } = useAuth();
  return profile?.role === 'admin';
}
