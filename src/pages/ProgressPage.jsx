import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Crosshair, Award, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

export default function ProgressPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ topicsRead: 0 });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Progresso de leitura
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('conteudo_lido, topics(nome, subjects(nome, cor))')
          .eq('user_id', user.id);

        const lidos = (progressData || []).filter(p => p.conteudo_lido).length;

        // Sessões de quiz históricas
        const { data: sessionsData } = await supabase
          .from('quiz_sessions')
          .select('questions_total, questions_correct, score_percent, completed_at, topics(nome, subjects(nome, cor))')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(20);

        const allSessions = sessionsData || [];
        const totalQ = allSessions.reduce((a, s) => a + s.questions_total, 0);
        const totalC = allSessions.reduce((a, s) => a + s.questions_correct, 0);
        const accuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;

        setStats({ topicsRead: lidos, totalQ, totalC, accuracy, sessions: allSessions.length });
        setSessions(allSessions);
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
        <p className="text-sm text-text-muted">Calculando estatísticas...</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Taxa de Acertos', value: `${stats.accuracy}%`, icon: Crosshair, colorClass: 'text-accent bg-accent/10' },
    { label: 'Questões Respondidas', value: stats.totalQ ?? 0, icon: TrendingUp, colorClass: 'text-blue-400 bg-blue-400/10' },
    { label: 'Módulos Lidos', value: stats.topicsRead, icon: Award, colorClass: 'text-success bg-success/10' },
    { label: 'Sessões de Quiz', value: stats.sessions ?? 0, icon: BarChart3, colorClass: 'text-warning bg-warning/10' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20 space-y-10">
      <section>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent/10 text-accent">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Meu Progresso</h1>
        </div>
        <p className="text-sm mt-1 ml-12 text-text-muted">
          Acompanhe seu desempenho e histórico de estudos.
        </p>
      </section>

      {/* KPIs */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-2 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={i} variants={fadeUp} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.colorClass}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{k.value}</div>
              <div className="text-xs text-text-muted">{k.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Histórico de sessões */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-text-muted" />
          <h2 className="text-base font-semibold text-text-primary">Histórico de Sessões de Quiz</h2>
        </div>

        {sessions.length === 0 ? (
          <div className="glass-card p-10 text-center text-text-muted">
            Nenhuma sessão de quiz registrada ainda.<br />
            <span className="text-xs">Vá em "Questões" para praticar!</span>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s, i) => {
              const scoreColorClass = s.score_percent >= 70 ? 'text-success' : s.score_percent >= 50 ? 'text-warning' : 'text-error';
              const subjectColor = s.topics?.subjects?.cor || 'var(--accent)';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass-card flex items-center justify-between p-4 px-5 py-3.5 ${i === 0 ? 'bg-accent/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: subjectColor }} />
                    <div>
                      <div className="text-sm font-medium text-text-primary">{s.topics?.nome || 'Tópico'}</div>
                      <div className="text-xs text-text-muted">
                        {s.topics?.subjects?.nome} · {new Date(s.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className={`text-sm font-bold ${scoreColorClass}`}>{s.score_percent}%</div>
                    <div className="text-xs text-text-muted">{s.questions_correct}/{s.questions_total}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}
