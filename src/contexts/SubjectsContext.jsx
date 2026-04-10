import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const SubjectsContext = createContext(null);

/**
 * Provider global que faz o fetch de matérias uma única vez
 * e mantém em memória enquanto o usuário estiver logado.
 * Elimina o re-render/skeleton irritante ao navegar entre páginas.
 */
export function SubjectsProvider({ children }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false); // Flag para evitar re-fetch

  const fetchSubjects = useCallback(async (force = false) => {
    if (!user) return;
    // Se já carregou e não é forçado, usa o cache
    if (fetchedRef.current && !force) return;

    try {
      setLoading(true);
      setError(null);

      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          id, nome, categoria, cor, icone, ordem,
          topics (id)
        `)
        .order('ordem');

      if (subjectsError) throw subjectsError;

      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('topic_id, acertos, total_questoes, conteudo_lido')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      const enriched = subjectsData.map(subject => {
        const subjectTopicIds = subject.topics.map(t => t.id);
        const related = (progressData || []).filter(p => subjectTopicIds.includes(p.topic_id));
        // topicsDone = apenas tópicos com leitura marcada
        const topicsDone = related.filter(p => p.conteudo_lido).length;
        return { ...subject, topicsTotal: subject.topics.length, topicsDone, score: 0 };
      });

      setSubjects(enriched);
      fetchedRef.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const invalidateCache = useCallback(() => {
    fetchedRef.current = false;
  }, []);

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
