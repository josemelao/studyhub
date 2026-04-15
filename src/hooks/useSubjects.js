import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';

export function useSubjects() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Busca todas as matérias com seus tópicos
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          id,
          nome,
          categoria,
          cor,
          icone,
          ordem,
          topics (id)
        `)
        .eq('workspace_id', currentWorkspaceId)
        .order('ordem');

      if (subjectsError) throw subjectsError;

      if (!user) {
         setSubjects(subjectsData);
         return;
      }

      // Busca progresso do usuário para calcular métricas
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('topic_id, acertos, total_questoes, conteudo_lido')
        .eq('user_id', user.id)
        .eq('workspace_id', currentWorkspaceId);

      if (progressError) throw progressError;

      // Monta os dados enriquecidos
      const enrichedSubjects = subjectsData.map(subject => {
        let totalTopics = subject.topics.length;
        let topicsDone = 0;
        let totalQuestions = 0;
        let totalCorrect = 0;

        const subjectTopicIds = subject.topics.map(t => t.id);
        const relatedProgress = progressData.filter(p => subjectTopicIds.includes(p.topic_id));

        relatedProgress.forEach(p => {
          if (p.conteudo_lido && p.total_questoes > 0) {
            topicsDone++;
          }
          totalQuestions += p.total_questoes;
          totalCorrect += p.acertos;
        });

        const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        return {
          ...subject,
          topicsTotal: totalTopics,
          topicsDone,
          score
        };
      });

      setSubjects(enrichedSubjects);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return { subjects, loading, error, refetch: fetchSubjects };
}
