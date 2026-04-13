import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Trophy, Clock, ChevronDown, Filter, 
  Search, Loader2, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { pageVariants, staggerContainer, staggerItem, scaleIn } from '../lib/animations';

export default function HistoryPage() {
  const { user } = useAuth();
  console.log("DEBUG: Renderizando HistoryPage v3.1");

  
  // States
  const [tab, setTab] = useState('simulados'); // 'simulados' | 'questoes'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  // Filters
  const [period, setPeriod] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [performance, setPerformance] = useState('all'); // 'all' | 'high' | 'low'
  const [showFilters, setShowFilters] = useState(false);

  const fetchHistory = useCallback(async (isLoadMore = false) => {
    if (!user) return;
    
    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      const from = isLoadMore ? page * PAGE_SIZE : 0;
      const to = from + PAGE_SIZE - 1;

      let query;
      
      if (tab === 'simulados') {
        query = supabase
          .from('exam_sessions')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'finalizada');

        // Apply filters
        if (period === 'today') {
           const today = new Date(); today.setHours(0,0,0,0);
           query = query.gte('finalizada_em', today.toISOString());
        } else if (period === 'week') {
           const week = new Date(); week.setDate(week.getDate() - 7);
           query = query.gte('finalizada_em', week.toISOString());
        } else if (period === 'month') {
           const month = new Date(); month.setMonth(month.getMonth() - 1);
           query = query.gte('finalizada_em', month.toISOString());
        }
        
        // Sorting and Pagination
        query = query.order('finalizada_em', { ascending: false }).range(from, to);

      } else {
        query = supabase
          .from('quiz_sessions')
          .select('*, topics(nome, subjects(nome, cor))', { count: 'exact' })
          .eq('user_id', user.id);

        // Apply filters
        if (performance === 'high') query = query.gte('score_percent', 80);
        if (performance === 'low') query = query.lt('score_percent', 50);

        if (period === 'today') {
           const today = new Date(); today.setHours(0,0,0,0);
           query = query.gte('completed_at', today.toISOString());
        } else if (period === 'week') {
           const week = new Date(); week.setDate(week.getDate() - 7);
           query = query.gte('completed_at', week.toISOString());
        } else if (period === 'month') {
           const month = new Date(); month.setMonth(month.getMonth() - 1);
           query = query.gte('completed_at', month.toISOString());
        }

        query = query.order('completed_at', { ascending: false }).range(from, to);
      }

      const { data, count, error } = await query;
      
      if (error) throw error;
      
      if (tab === 'simulados' && performance !== 'all') {
         // App-level filtering for simulado performance since score is calculated
         // In exam_sessions, score isn't stored directly, but maybe we can just ignore performance filter for simulados or calculate it
      }

      setItems(prev => isLoadMore ? [...prev, ...(data || [])] : (data || []));
      setHasMore((from + PAGE_SIZE) < count);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, tab, period, performance, page]);

  useEffect(() => {
    setPage(0);
    fetchHistory(false);
  }, [tab, period, performance]); // Trigger fetch when filters change

  useEffect(() => {
    if (page > 0) fetchHistory(true);
  }, [page]);

  const renderSimuladoCard = (exam) => {
    const date = new Date(exam.finalizada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const time = exam.tempo_gasto_segundos ? `${Math.floor(exam.tempo_gasto_segundos/60)}m ${exam.tempo_gasto_segundos%60}s` : '--';
    const questions = exam.questoes?.length || 0;
    
    return (
      <Link key={exam.id} to={`/modo-prova/resultado/${exam.id}`} className="block">
        <motion.div variants={staggerItem} className="glass-card flex items-center justify-between p-5 md:p-6 border-l-4 border-accent hover:bg-white/[0.04] transition-all group">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Trophy className="w-4 h-4 text-accent" />
              <div className="text-base font-bold text-primary group-hover:text-accent transition-colors">Simulado</div>
            </div>
            <div className="text-sm font-medium text-muted mt-1">{date}</div>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs font-bold px-2 py-1 bg-white/[0.05] rounded-md text-secondary">{questions} questões</span>
              <span className="text-xs font-bold px-2 py-1 bg-white/[0.05] rounded-md text-secondary">⏱ {time}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 -translate-x-4">
            <ArrowRight className="w-5 h-5" />
          </div>
        </motion.div>
      </Link>
    );
  };

  const renderQuestaoCard = (s) => {
    const isHigh = s.score_percent >= 80;
    const isMedium = s.score_percent >= 50 && s.score_percent < 80;
    const scoreColor = isHigh ? 'text-success' : isMedium ? 'text-warning' : 'text-error';
    const barColor = isHigh ? 'bg-success' : isMedium ? 'bg-warning' : 'bg-error';
    
    return (
      <motion.div key={s.id} variants={staggerItem} className="glass-card flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 hover:bg-white/[0.02] transition-colors relative overflow-hidden">
        {/* Color Accent Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor} opacity-50`} />
        
        <div className="mb-4 md:mb-0 pl-2">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-muted" />
            <span className="text-xs font-medium text-muted">{new Date(s.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="text-base md:text-lg font-bold text-primary mt-1">{s.topics?.nome || 'Tópico de Bateria'}</div>
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">{s.topics?.subjects?.nome}</div>
        </div>
        
        <div className="flex items-center gap-6 pl-2 md:pl-0">
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Acertos</div>
            <div className="text-lg font-black text-primary">{s.questions_correct}<span className="text-muted text-sm">/{s.questions_total}</span></div>
          </div>
          <div className="h-10 w-px bg-border-default" />
          <div className="text-right w-16">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Score</div>
            <div className={`text-2xl font-black ${scoreColor}`}>{s.score_percent}%</div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div id="history-page-v3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pb-24 space-y-8">
      {/* Header section */}
      <motion.section variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">Histórico</h1>
          </div>
          <p className="text-sm text-muted ml-14">Revise detalhadamente seus testes e simulados passados.</p>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${showFilters ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-secondary border-default text-muted hover:text-primary'}`}
        >
          <Filter className="w-4 h-4" /> Filtros {period !== 'all' || performance !== 'all' ? '(Ativos)' : ''}
        </button>
      </motion.section>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-secondary border border-default rounded-2xl w-full max-w-md">
        <button
          onClick={() => setTab('simulados')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'simulados' ? 'bg-gradient-accent text-white shadow-glow-accent' : 'text-muted hover:text-secondary'}`}
        >
          <Trophy className="w-4 h-4" /> Simulados
        </button>
        <button
          onClick={() => setTab('questoes')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'questoes' ? 'bg-gradient-accent text-white shadow-glow-accent' : 'text-muted hover:text-secondary'}`}
        >
          <Clock className="w-4 h-4" /> Questões
        </button>
      </div>

      {/* Filters (Collapsible) */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 border-accent/20 bg-accent/[0.02] grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-3">Período</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'today', 'week', 'month'].map(p => (
                    <button 
                      key={p} onClick={() => setPeriod(p)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${period === p ? 'bg-accent border-accent text-white shadow-accent' : 'bg-secondary border-transparent text-muted hover:bg-white/[0.05]'}`}
                    >
                      {p === 'all' ? 'Todo tempo' : p === 'today' ? 'Hoje' : p === 'week' ? 'Últimos 7 dias' : 'Último Mês'}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'questoes' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted mb-3">Performance</label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'high', 'low'].map(p => (
                      <button 
                        key={p} onClick={() => setPerformance(p)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${performance === p ? 'bg-accent border-accent text-white shadow-accent' : 'bg-secondary border-transparent text-muted hover:bg-white/[0.05]'}`}
                      >
                        {p === 'all' ? 'Todos' : p === 'high' ? 'Acima de 80%' : 'Abaixo de 50%'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted">Carregando histórico...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center px-4">
          <Search className="w-12 h-12 text-muted opacity-30 mb-4" />
          <h3 className="text-lg font-bold text-primary mb-2">Nenhum resultado encontrado</h3>
          <p className="text-sm text-muted">Ajuste os filtros ou conclua testes para ver seus resultados aqui.</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {items.map(item => tab === 'simulados' ? renderSimuladoCard(item) : renderQuestaoCard(item))}
          
          {hasMore && (
            <motion.div variants={staggerItem} className="pt-8 flex justify-center">
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-subtle text-accent border border-accent-border hover:bg-accent/20 transition-all font-bold text-sm shadow-sm"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Carregar mais históricos'}
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
