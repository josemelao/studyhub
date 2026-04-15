import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Crosshair, Award, Clock, Loader2, Flame, Trophy, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Link } from 'react-router-dom';
import { pageVariants, staggerContainer, staggerItem, scaleIn } from '../lib/animations';

export default function ProgressPage() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ topicsRead: 0, totalQ: 0, totalC: 0, accuracy: 0, sessions: 0, streakMax: 0, conquistas: [] });
  const [sessions, setSessions] = useState([]);
  const [examSessions, setExamSessions] = useState([]);
  const [openQuestions, setOpenQuestions] = useState(false);
  const [openExams, setOpenExams] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user || !currentWorkspaceId) return;
      try {
        setLoading(true);

        // 1. Buscar progresso de leitura
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('conteudo_lido, acertos, total_questoes')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId);
          
        const lidos = (progressData || []).filter(p => p.conteudo_lido).length;
        const totalQLocal = (progressData || []).reduce((acc, p) => acc + (p.total_questoes || 0), 0);
        const totalCLocal = (progressData || []).reduce((acc, p) => acc + (p.acertos || 0), 0);

        // 2. Buscar historico de quizzes
        const { data: sessionsData } = await supabase
          .from('quiz_sessions')
          .select('questions_total, questions_correct, score_percent, completed_at, topics(nome, subjects(nome, cor))')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .order('completed_at', { ascending: false })
          .limit(5);

        // 3. Buscar stats globais (XP e Streaks)
        const { data: globalStats } = await supabase
          .from('user_stats')
          .select('streak_atual, streak_max, pontos_xp')
          .eq('user_id', user.id)
          .single();

        // 4. Buscar stats locais do workspace (Conquistas e performance específica se necessário)
        const { data: localStats } = await supabase
          .from('workspace_stats')
          .select('conquistas, total_questoes_respondidas, total_acertos')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .single();

        // 5. Buscar histórico de simulados (Modo Prova)
        const { data: examData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'finalizada')
          .order('finalizada_em', { ascending: false })
          .limit(5);

        const allSessions = sessionsData || [];
        
        setStats({ 
          topicsRead: lidos, 
          totalQ: localStats?.total_questoes_respondidas || 0, 
          totalC: localStats?.total_acertos || 0, 
          accuracy: (localStats?.total_questoes_respondidas > 0) ? Math.round((localStats.total_acertos / localStats.total_questoes_respondidas) * 100) : 0, 
          sessions: allSessions.length,
          streakMax: globalStats?.streak_max || 0,
          streakAtual: globalStats?.streak_atual || 0,
          conquistas: localStats?.conquistas || [],
          xp: globalStats?.pontos_xp || 0
        });
        setSessions(allSessions);
        setExamSessions(examData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, currentWorkspaceId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-36 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted">Calculando estatísticas...</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Taxa de Acertos', value: `${stats.accuracy}%`, icon: Crosshair, colorClass: 'text-accent bg-accent/10' },
    { label: 'Questões Respondidas', value: stats.totalQ, icon: TrendingUp, colorClass: 'text-blue-400 bg-blue-400/10' },
    { label: 'Recorde de Streak', value: `${stats.streakMax} dias`, icon: Flame, colorClass: 'text-orange-500 bg-orange-500/10' },
    { label: 'Módulos Lidos', value: stats.topicsRead, icon: Award, colorClass: 'text-success bg-success/10' },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pb-20 space-y-12">
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Meu Progresso</h1>
        </div>
        <p className="text-sm text-muted ml-14">Acompanhe seu desempenho e conquistas desbloqueadas.</p>
      </motion.section>

      {/* Bento Grid de KPIs */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {/* KPI Principal: Taxa de Acertos (2x2) */}
        <motion.div 
          variants={staggerItem} 
          className="md:col-span-2 md:row-span-2 glass-card p-8 flex flex-col justify-between bg-accent/5 border-accent/20 relative overflow-hidden group"
        >
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Crosshair size={160} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-glow-accent mb-auto">
            <Crosshair className="w-6 h-6" />
          </div>
          <div>
            <div className="text-6xl font-black text-primary tracking-tighter mb-1">{stats.accuracy}%</div>
            <div className="text-xs font-black text-muted uppercase tracking-widest">Taxa de Acertos Geral</div>
          </div>
        </motion.div>

        {/* KPI: Streak Atual (2x1) */}
        <motion.div 
          variants={staggerItem} 
          className="md:col-span-2 lg:col-span-2 glass-card p-6 flex items-center gap-6 border-orange-500/20 bg-orange-500/5 relative overflow-hidden group"
        >
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Flame size={100} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-glow-orange shrink-0 relative z-10">
            <Flame className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-primary tracking-tight">{stats.streakAtual} dias</div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">Streak Atual</div>
          </div>
        </motion.div>

        {/* KPI: Questões Respondidas (2x1) */}
        <motion.div 
          variants={staggerItem} 
          className="md:col-span-2 lg:col-span-2 glass-card p-6 flex items-center gap-6 border-blue-500/20 bg-blue-500/5 relative overflow-hidden group"
        >
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <TrendingUp size={100} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-glow-blue shrink-0 relative z-10">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-primary tracking-tight">{stats.totalQ}</div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">Questões Respondidas</div>
          </div>
        </motion.div>

        {/* KPI: Módulos Lidos (2x1) */}
        <motion.div 
          variants={staggerItem} 
          className="md:col-span-2 lg:col-span-2 glass-card p-6 flex items-center gap-6 border-success/20 bg-success/5 relative overflow-hidden group"
        >
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Award size={100} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-success text-white flex items-center justify-center shadow-glow-success shrink-0 relative z-10">
            <Award className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-primary tracking-tight">{stats.topicsRead}</div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">Módulos Lidos</div>
          </div>
        </motion.div>

        {/* KPI: Recorde de Streak (2x1) */}
        <motion.div 
          variants={staggerItem} 
          className="md:col-span-2 lg:col-span-2 glass-card p-6 flex items-center gap-6 border-default bg-secondary relative overflow-hidden group"
        >
          <div className="absolute -right-6 -bottom-6 opacity-[0.02] group-hover:opacity-[0.07] transition-opacity">
            <Trophy size={100} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-primary flex items-center justify-center shrink-0 relative z-10">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-primary tracking-tight">{stats.streakMax}</div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">Recorde de Streak</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Seção de Conquistas (Bento Gallery) */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-black text-primary tracking-tight uppercase tracking-widest text-sm">Suas Conquistas</h2>
          </div>
          <span className="text-[10px] font-black text-muted bg-white/5 px-2 py-1 rounded-md">{stats.conquistas.length} DESBLOQUEADAS</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
           {stats.conquistas.length === 0 ? (
             <div className="col-span-full glass-card p-12 text-center text-muted border-dashed border-2">
               Ainda não há conquistas. Continue estudando para desbloqueá-las!
             </div>
           ) : (
             stats.conquistas.map((c, i) => (
               <motion.div 
                 key={i} 
                 variants={scaleIn} 
                 className="glass-card p-4 flex flex-col items-center text-center gap-3 border-default bg-secondary hover:bg-accent/5 hover:border-accent/20 transition-all group"
               >
                 <div className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{c.icone}</div>
                 <div>
                   <div className="text-[9px] font-black text-primary uppercase tracking-tighter leading-none mb-1">{c.titulo}</div>
                   <div className="text-[7px] text-muted font-bold uppercase">{new Date(c.unlocked_at).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}</div>
                 </div>
               </motion.div>
             ))
           )}
        </div>
      </motion.section>

      {/* Histórico - Questões */}
      <motion.section variants={staggerItem}>
        <button 
          onClick={() => setOpenQuestions(!openQuestions)}
          className="w-full flex items-center justify-between p-4 mb-2 rounded-2xl glass-card transition-all hover:bg-white/[0.04]"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-primary">Questões Resolvidas</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted transition-transform duration-300 ${openQuestions ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {openQuestions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                {sessions.length === 0 ? (
                  <div className="glass-card p-6 text-center text-muted border-dashed border-2">Nenhuma questão resolvida.</div>
                ) : (
                  sessions.map((s, i) => (
                    <div key={i} className="glass-card flex items-center justify-between p-5 border-l-4" style={{ borderLeftColor: s.topics?.subjects?.cor || 'var(--accent)' }}>
                      <div>
                        <div className="text-base font-bold text-primary">{s.topics?.nome || 'Questões'}</div>
                        <div className="text-xs font-medium text-muted">{s.topics?.subjects?.nome} · {new Date(s.completed_at).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black ${s.score_percent >= 70 ? 'text-success' : 'text-accent'}`}>{s.score_percent}%</div>
                        <div className="text-[10px] font-bold text-muted mt-0.5 tracking-tight">{s.questions_correct}/{s.questions_total} certas</div>
                      </div>
                    </div>
                  ))
                )}
                
                {sessions.length > 0 && (
                  <Link to="/historico" className="block text-center py-3 mt-2 text-xs font-black uppercase tracking-widest text-accent hover:text-accent-hover transition-colors">
                    Ver Histórico Completo &rarr;
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Histórico de Simulados */}
      <motion.section variants={staggerItem}>
        <button 
          onClick={() => setOpenExams(!openExams)}
          className="w-full flex items-center justify-between p-4 mb-2 rounded-2xl glass-card transition-all hover:bg-white/[0.04]"
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-primary">Simulados Resolvidos</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted transition-transform duration-300 ${openExams ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {openExams && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                {examSessions.length === 0 ? (
                  <div className="glass-card p-8 text-center text-muted border-dashed border-2">
                    Nenhum simulado finalizado. Vá para o Modo Prova!
                  </div>
                ) : (
                  examSessions.map((exam) => {
                    const date = new Date(exam.finalizada_em).toLocaleDateString();
                    const time = exam.tempo_gasto_segundos ? `${Math.floor(exam.tempo_gasto_segundos/60)}m ${exam.tempo_gasto_segundos%60}s` : '--';
                    const questions = exam.questoes?.length || 0;
                    
                    return (
                      <Link key={exam.id} to={`/modo-prova/resultado/${exam.id}`} className="glass-card flex items-center justify-between p-5 border-l-4 border-accent hover:bg-white/[0.04] transition-all group">
                        <div>
                          <div className="text-base font-bold text-primary group-hover:text-accent transition-colors">Simulado Padrão</div>
                          <div className="text-xs font-medium text-muted mt-0.5">{date} · {questions} questões · ⏱ {time}</div>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                          Abrir Resultado &rarr;
                        </div>
                      </Link>
                    );
                  })
                )}
                
                {examSessions.length > 0 && (
                  <Link to="/historico" className="block text-center py-3 mt-2 text-xs font-black uppercase tracking-widest text-accent hover:text-accent-hover transition-colors">
                    Ver Histórico Completo &rarr;
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
