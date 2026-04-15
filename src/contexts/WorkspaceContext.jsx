import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  // Chave de localStorage por usuário — evita que contas diferentes sobrescrevam o workspace uma da outra
  const getStorageKey = useCallback((userId) => `studyhub_active_ws_${userId}`, []);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setLoadingWorkspace(false);
      return;
    }
    setLoadingWorkspace(true);
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setWorkspaces(data);

        if (data.length > 0) {
          // Lê o workspace salvo DESTE usuário específico
          const storageKey = getStorageKey(user.id);
          const savedId = localStorage.getItem(storageKey);
          const isValidId = data.find(w => w.id === savedId);
          if (isValidId) {
            setCurrentWorkspaceId(savedId);
          } else {
            // Fallback: primeiro workspace (mais recente)
            const defaultWsId = data[0].id;
            setCurrentWorkspaceId(defaultWsId);
            localStorage.setItem(storageKey, defaultWsId);
          }
        } else {
          setCurrentWorkspaceId(null);
          if (user) localStorage.removeItem(getStorageKey(user.id));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar workspaces:', err);
    } finally {
      setLoadingWorkspace(false);
    }
  }, [user, getStorageKey]); // currentWorkspaceId removido das deps — evita loop de re-fetch

  useEffect(() => {
    if (authLoading) {
      setLoadingWorkspace(true);
      return;
    }
    fetchWorkspaces();
  }, [user, authLoading, fetchWorkspaces]);

  const setWorkspace = (id) => {
    if (user) localStorage.setItem(getStorageKey(user.id), id);
    setCurrentWorkspaceId(id);
  };

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || null;

  return (
    <WorkspaceContext.Provider value={{ 
      workspaces, 
      currentWorkspaceId,
      currentWorkspace,
      currentConcursoId: currentWorkspace?.concurso_id || null,
      setWorkspace, 
      fetchWorkspaces,
      loadingWorkspace 
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
