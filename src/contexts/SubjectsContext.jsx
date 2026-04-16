import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from './WorkspaceContext';

const SubjectsContext = createContext(null);

/**
 * Provider global que faz o fetch de matérias uma única vez
 * e mantém em memória enquanto o usuário estiver logado.
 * Elimina o re-render/skeleton irritante ao navegar entre páginas.
 */
export function SubjectsProvider({ children }) {
  const { user } = useAuth();
  const { currentWorkspaceId, currentConcursoId } = useWorkspace();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false); // Flag para evitar re-fetch

  const invalidateCache = useCallback(() => {
    fetchedRef.current = false;
  }, []);

  // Limpar a memória imediatamente quando o Workspace ou Concurso Mudar
  useEffect(() => {
    setSubjects([]);
    invalidateCache();
  }, [currentWorkspaceId, currentConcursoId, invalidateCache]);

  const fetchSubjects = useCallback(async (force = false) => {
    if (!user || !currentConcursoId) return;
    // Se já carregou e não é forçado, usa o cache
    if (fetchedRef.current && !force) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Matérias do Concurso
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          id, nome, categoria, cor, icone, ordem,
          topics (id)
        `)
        .eq('concurso_id', currentConcursoId)
        .order('ordem');

      if (subjectsError) throw subjectsError;

      // 2. Workspaces do mesmo concurso para unificar progresso
      const { data: siblingWorkspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('user_id', user.id)
        .eq('concurso_id', currentConcursoId);
      
      const workspaceIds = siblingWorkspaces?.map(w => w.id) || [currentWorkspaceId];

      // 3. Progresso Unificado
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('topic_id, acertos, total_questoes, conteudo_lido')
        .eq('user_id', user.id)
        .in('workspace_id', workspaceIds);

      if (progressError) throw progressError;

      const enriched = subjectsData.map(subject => {
        const subjectTopicIds = subject.topics.map(t => t.id);
        const related = (progressData || []).filter(p => subjectTopicIds.includes(p.topic_id));
        
        // topicsDone = considerar concluído se estiver lido em QUALQUER um dos workspaces do edital
        const doneTopicIds = new Set(
          related.filter(p => p.conteudo_lido).map(p => p.topic_id)
        );
        const topicsDone = doneTopicIds.size;

        return { ...subject, topicsTotal: subject.topics.length, topicsDone, score: 0 };
      });

      setSubjects(enriched);
      fetchedRef.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspaceId, currentConcursoId]);

  return (
    <SubjectsContext.Provider value={{ subjects, loading, error, fetchSubjects, invalidateCache }}>
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjectsContext() {
  const ctx = useContext(SubjectsContext);
  if (!ctx) throw new Error('useSubjectsContext deve ser usado dentro de SubjectsProvider');
  return ctx;
}
