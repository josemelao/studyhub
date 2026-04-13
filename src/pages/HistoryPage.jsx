import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Trophy, Clock, ChevronDown, Filter, 
  Search, Loader2, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { pageVariants, staggerContainer, staggerItem } from '../lib/animations';

export default function HistoryPage() {
  const { user } = useAuth();

  // States
  const [activities, setActivities] = useState({ simulados: [], questoes: [] });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [period, setPeriod] = useState('all'); 
  const [showFilters, setShowFilters] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Query Simulados
      let simQuery = supabase
        .from('exam_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'finalizada')
        .order('finalizada_em', { ascending: false })
        .limit(10);

      // Query Questões (Praticar)
      let quesQuery = supabase
        .from('quiz_sessions')
        .select('*, topics(nome, subjects(nome, cor))')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      // Aplicação de filtros de período se necessário
      if (period !== 'all') {
         const dateLimit = new Date();
         if (period === 'today') dateLimit.setHours(0,0,0,0);
         else if (period === 'week') dateLimit.setDate(dateLimit.getDate() - 7);
         else if (period === 'month') dateLimit.setMonth(dateLimit.getMonth() - 1);
         
         simQuery = simQuery.gte('finalizada_em', dateLimit.toISOString());
         quesQuery = quesQuery.gte('completed_at', dateLimit.toISOString());
      }

      const [simRes, quesRes] = await Promise.all([simQuery, quesQuery]);
      
      setActivities({
        simulados: simRes.data || [],
        questoes: quesRes.data || []
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const renderSimuladoCard = (exam) => {
    const date = new Date(exam.finalizada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const questions = exam.questoes?.length || 0;
    
    return (
      <Link key={exam.id} to={`/modo-prova/resultado/${exam.id}`} className="block">
        <motion.div variants={staggerItem} className="glass-card flex items-center justify-between p-4 border-l-4 border-accent hover:bg-white/[0.04] transition-all group border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
               <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-primary group-hover:text-accent transition-colors">Simulado BB</div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{date} · {questions} questões</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1" />
        </motion.div>
      </Link>
    );
  };

  const renderQuestaoCard = (s) => {
    const isHigh = s.score_percent >= 80;
    const isMedium = s.score_percent >= 50 && s.score_percent < 80;
    const scoreColor = isHigh ? 'text-success' : isMedium ? 'text-warning' : 'text-error';
    const date = new Date(s.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    
    return (
      <motion.div key={s.id} variants={staggerItem} className="glass-card p-4 border-white/5 hover:bg-white/[0.02] transition-colors relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
           <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-tight">{date}</span>
           </div>
           <div className={`text-sm font-black ${scoreColor}`}>{s.score_percent}%</div>
        </div>
        
        <div className="text-sm font-bold text-primary truncate mb-1">{s.topics?.nome || 'Questões'}</div>
        <div className="text-[9px] font-black text-secondary uppercase tracking-widest">{s.topics?.subjects?.nome}</div>
        
        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
           <span className="text-[10px] text-muted font-bold">{s.questions_correct}/{s.questions_total} certas</span>
           <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                 <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= (s.score_percent/20) ? 'bg-accent' : 'bg-white/5'}`} />
              ))}
           </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pb-24 space-y-10">
      <motion.section variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
              <History className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-primary tracking-tighter italic">Histórico</h1>
          </div>
          <p className="text-sm text-muted ml-16 font-medium">Sua jornada de estudos em uma linha do tempo detalhada.</p>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all text-xs font-black uppercase tracking-widest ${showFilters ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-secondary border-default text-muted hover:text-primary'}`}
        >
          <Filter className="w-4 h-4" /> Filtros {period !== 'all' ? '(Ativos)' : ''}
        </button>
      </motion.section>

      {/* Filters (Collapsible) */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 border-accent/20 bg-accent/[0.02] w-full max-w-3xl">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-4">Período de Visualização</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'today', 'week', 'month'].map(p => (
                  <button 
                    key={p} onClick={() => setPeriod(p)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${period === p ? 'bg-accent border-accent text-white shadow-glow-accent' : 'bg-secondary border-default text-muted hover:bg-white/[0.05]'}`}
                  >
                    {p === 'all' ? 'Todo tempo' : p === 'today' ? 'Hoje' : p === 'week' ? '7 dias' : '30 dias'}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted font-medium">Sincronizando atividades...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
           
           {/* Coluna 1: Simulados */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                 <Trophy className="w-5 h-5 text-accent" />
                 <h2 className="text-xl font-black text-primary tracking-tight uppercase tracking-widest text-sm">Simulados Completos</h2>
                 <div className="h-px flex-1 bg-white/5 ml-2" />
                 <span className="text-[10px] font-black text-muted bg-white/5 px-2 py-1 rounded-md">{activities.simulados.length}</span>
              </div>

              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                 {activities.simulados.length === 0 ? (
                    <div className="glass-card p-12 text-center text-muted border-dashed border-white/5">Nenhum simulado finalizado neste período.</div>
                 ) : (
                    activities.simulados.map(item => renderSimuladoCard(item))
                 )}
              </motion.div>
           </div>

           {/* Coluna 2: Questões */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                 <Clock className="w-5 h-5 text-success" />
                 <h2 className="text-xl font-black text-primary tracking-tight uppercase tracking-widest text-sm">Baterias de Prática</h2>
                 <div className="h-px flex-1 bg-white/5 ml-2" />
                 <span className="text-[10px] font-black text-muted bg-white/5 px-2 py-1 rounded-md">{activities.questoes.length}</span>
              </div>

              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                 {activities.questoes.length === 0 ? (
                    <div className="glass-card lg:col-span-full p-12 text-center text-muted border-dashed border-white/5">Nenhuma prática registrada.</div>
                 ) : (
                    activities.questoes.map(item => renderQuestaoCard(item))
                 )}
              </motion.div>
           </div>
        </div>
      )}
    </motion.div>
  );
}
