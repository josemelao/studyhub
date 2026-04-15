import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(
    localStorage.getItem('studyhub_active_ws') || null
  );
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

    const fetchWorkspaces = useCallback(async () => {
      if (!user) return;
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
            const isValidId = data.find(w => w.id === currentWorkspaceId);
            if (!isValidId) {
               const defaultWsId = data[0].id;
               setCurrentWorkspaceId(defaultWsId);
               localStorage.setItem('studyhub_active_ws', defaultWsId);
            }
          } else {
             setCurrentWorkspaceId(null);
             localStorage.removeItem('studyhub_active_ws');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar workspaces:', err);
      } finally {
        setLoadingWorkspace(false);
      }
    }, [user, currentWorkspaceId]);

    useEffect(() => {
      if (authLoading) {
        setLoadingWorkspace(true);
        return;
      }
      fetchWorkspaces();
    }, [user, authLoading, fetchWorkspaces]); // Adicionado authLoading para sincronização total

  const setWorkspace = (id) => {
    localStorage.setItem('studyhub_active_ws', id);
    setCurrentWorkspaceId(id);
  };

  return (
    <WorkspaceContext.Provider value={{ 
      workspaces, 
      currentWorkspaceId, 
      currentWorkspace: workspaces.find(w => w.id === currentWorkspaceId) || null,
      setWorkspace, 
      fetchWorkspaces,
      loadingWorkspace 
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
