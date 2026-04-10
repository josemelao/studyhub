import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, CheckCircle2, Loader2, TrendingUp, BookOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubjectsContext } from '../contexts/SubjectsContext';
import { Link } from 'react-router-dom';

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

export default function DashboardPage() {
  const { user } = useAuth();
  const { subjects, loading, fetchSubjects } = useSubjectsContext();

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const daysToExam = 68;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-text-muted">Carregando painel...</p>
    </div>
  );

  const totalTopics = subjects.reduce((a, s) => a + s.topicsTotal, 0);
  const doneTopics  = subjects.reduce((a, s) => a + s.topicsDone, 0);
  const progress = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-16 space-y-10">

      {/* ── Hero ── */}
      <section className="rounded-2xl p-7 relative overflow-hidden bg-gradient-hero border border-border-default">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <h1 className="text-2xl font-bold mb-1 text-text-primary">
          Bom dia, {user?.email?.split('@')[0]}! 👋
        </h1>
        <div className="flex items-center gap-2 text-sm mt-1 text-text-secondary">
          <Clock className="w-4 h-4 text-accent" />
          <span>Banco do Brasil — <strong className="text-text-primary">{daysToExam} dias</strong> até a prova</span>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs mb-2 text-text-muted">
            <span>Progresso de leitura</span>
            <span className="text-accent font-semibold">{doneTopics}/{totalTopics} módulos</span>
          </div>
          <div className="progress-track h-2">
            <div className="progress-fill h-2" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-cols-2 gap-4">
        {[
          { label: 'Módulos lidos', value: doneTopics, total: totalTopics, icon: BookOpen },
          { label: 'Conclusão geral', value: `${progress}%`, icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-accent/10 text-accent">
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              <div className="text-xs text-text-muted">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Matérias ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-text-primary">Suas Matérias</h2>
          <Link to="/materias" className="text-sm font-medium flex items-center gap-1 text-accent hover:text-accent/80 transition-colors">
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map(sub => {
            const percent = sub.topicsTotal > 0 ? Math.round((sub.topicsDone / sub.topicsTotal) * 100) : 0;
            const Icon = Icons[sub.icone] || Icons.BookOpen;

            return (
              <Link to={`/materia/${sub.id}`} key={sub.id}>
                <motion.div variants={fadeUp} className="glass-card p-5 cursor-pointer group">
                  <div className="flex items-start gap-3 mb-5">
                    {/* Cor dinâmica do banco — inline style legítimo */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
                      style={{ background: `${sub.cor}18`, color: sub.cor, border: `1px solid ${sub.cor}30` }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-text-primary group-hover:text-accent transition-colors">
                        {sub.nome}
                      </h3>
                      <p className="text-xs mt-0.5 text-text-muted">
                        {sub.topicsDone}/{sub.topicsTotal} módulos lidos
                      </p>
                    </div>
                    {percent === 100 && sub.topicsTotal > 0 && (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-success" />
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5 text-text-muted">
                      <span>Leitura</span>
                      {/* Cor dinâmica — inline style legítimo */}
                      <span style={{ color: sub.cor }} className="font-semibold">{percent}%</span>
                    </div>
                    <div className="progress-track h-1.5">
                      <div className="progress-fill h-1.5" style={{ width: `${percent}%`, background: sub.cor }} />
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </section>
    </motion.div>
  );
}
