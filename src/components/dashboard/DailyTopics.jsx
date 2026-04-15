import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, BookOpen, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export default function DailyTopics({ selectedDate }) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDailyTopics() {
      if (!user || !selectedDate || !currentWorkspaceId) return;
      try {
        setLoading(true);
        const dateStr = selectedDate.toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('study_plans')
          .select('topicos')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('data', dateStr)
          .limit(1);

        if (error) throw error;
        setTopics(data?.[0]?.topicos || []);
      } catch (err) {
        console.error('Erro ao carregar tópicos do dia:', err);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDailyTopics();
  }, [user, selectedDate, currentWorkspaceId]);

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-default flex items-center justify-between gap-2 text-primary">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest">Tópicos do Dia</span>
        </div>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted" />}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 thin-scrollbar">
        <AnimatePresence mode="wait">
          {topics.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="empty"
              className="h-full flex flex-col items-center justify-center opacity-40 py-8"
            >
              <BookOpen className="w-8 h-8 text-muted mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted text-center leading-tight">
                Nenhum tópico<br />planejado para hoje
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="list"
              className="space-y-3"
            >
              {topics.map((topic, i) => (
                <div 
                  key={topic.id}
                  className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-accent/20 hover:bg-white/[0.07] transition-all"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-1 h-8 rounded-full shrink-0" 
                      style={{ backgroundColor: topic.cor, boxShadow: `0 0 8px ${topic.cor}60` }}
                    />
                    <div className="min-w-0">
                        <h4 className="text-xs font-bold text-primary truncate group-hover:text-accent transition-colors">
                          {topic.nome}
                        </h4>
                        <p className="text-[10px] text-muted font-medium truncate">
                          {topic.subjectName || 'Matéria'}
                        </p>
                    </div>
                  </div>

                  <Link to={`/estudo/${topic.id}`}>
                    <button className="p-1.5 rounded-lg bg-accent/10 text-accent opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight size={14} />
                    </button>
                  </Link>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-4 bg-accent/5 border-t border-accent/10">
         <Link to="/planejador">
           <button className="w-full py-2 rounded-lg bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-glow-accent hover:opacity-90 transition-all">
              Organizar Cronograma
           </button>
         </Link>
      </div>
    </div>
  );
}
