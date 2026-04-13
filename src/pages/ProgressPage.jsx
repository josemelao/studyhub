import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Crosshair, Award, Clock, Loader2, Flame, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { pageVariants, staggerContainer, staggerItem, scaleIn } from '../lib/animations';

export default function ProgressPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ topicsRead: 0, totalQ: 0, totalC: 0, accuracy: 0, sessions: 0, streakMax: 0, conquistas: [] });
  const [sessions, setSessions] = useState([]);
  const [examSessions, setExamSessions] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1. Buscar progresso de leitura
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('conteudo_lido')
          .eq('user_id', user.id);
        const lidos = (progressData || []).filter(p => p.conteudo_lido).length;

        // 2. Buscar historico de quizzes
        const { data: sessionsData } = await supabase
          .from('quiz_sessions')
          .select('questions_total, questions_correct, score_percent, completed_at, topics(nome, subjects(nome, cor))')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(20);

        // 3. Buscar stats de gamificação
        const { data: userStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // 4. Buscar histórico de simulados (Modo Prova)
        const { data: examData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'finalizada')
          .order('finalizada_em', { ascending: false })
          .limit(10);

        const allSessions = sessionsData || [];
        
        setStats({ 
          topicsRead: lidos, 
          totalQ: userStats?.total_questoes_respondidas || 0, 
          totalC: userStats?.total_acertos || 0, 
          accuracy: userStats?.total_questoes_respondidas > 0 ? Math.round((userStats.total_acertos / userStats.total_questoes_respondidas) * 100) : 0, 
          sessions: allSessions.length,
          streakMax: userStats?.streak_max || 0,
          streakAtual: userStats?.streak_atual || 0,
          conquistas: userStats?.conquistas || []
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
  }, [user]);

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

      {/* KPIs */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={i} variants={staggerItem} className="glass-card p-6 flex flex-col gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.colorClass}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-3xl font-bold text-primary tracking-tight">{k.value}</div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider">{k.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Conquistas (Achievements) */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-3 mb-6 px-1">
          <Trophy className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-primary">Suas Conquistas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {stats.conquistas.length === 0 ? (
             <div className="col-span-full glass-card p-10 text-center text-muted">Ainda não há conquistas. Continue estudando para desbloqueá-las!</div>
           ) : (
             stats.conquistas.map((c, i) => (
               <motion.div key={i} variants={scaleIn} className="glass-card p-5 flex items-center gap-4 border-accent/20 bg-accent/[0.02]">
                 <div className="text-3xl">{c.icone}</div>
                 <div>
                   <div className="text-sm font-black text-primary uppercase tracking-tight">{c.titulo}</div>
                   <div className="text-[10px] text-muted font-bold mt-0.5">Desbloqueado em {new Date(c.unlocked_at).toLocaleDateString()}</div>
                 </div>
               </motion.div>
             ))
           )}
        </div>
      </motion.section>

      {/* Histórico */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-3 mb-6 px-1">
          <Clock className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-primary">Atividade Recente</h2>
        </div>
        <div className="space-y-3">
          {sessions.map((s, i) => (
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
          ))}
        </div>
      </motion.section>

      {/* Histórico de Simulados */}
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-3 mb-6 px-1">
          <Trophy className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-primary">Simulados Resolvidos</h2>
        </div>
        <div className="space-y-3">
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
        </div>
      </motion.section>
    </motion.div>
  );
}
