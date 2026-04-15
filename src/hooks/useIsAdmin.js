import { useAuth } from './useAuth';

const ADMIN_EMAIL = 'jose.tadeu.junior@gmail.com';

/**
 * Hook que verifica se o usuário atual é o administrador do sistema.
 * Apenas o admin pode acessar a tela de Gerenciar Conteúdo.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.email === ADMIN_EMAIL;
}
