import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, CheckCircle2, Loader2, TrendingUp, BookOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubjectsContext } from '../contexts/SubjectsContext';
import { Link } from 'react-router-dom';
import { pageVariants, staggerContainer, staggerItem } from '../lib/animations';

export default function DashboardPage() {
  const { user } = useAuth();
  const { subjects, loading, fetchSubjects } = useSubjectsContext();

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const daysToExam = 68;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted">Carregando painel...</p>
    </div>
  );

  const totalTopics = subjects.reduce((a, s) => a + s.topicsTotal, 0);
  const doneTopics  = subjects.reduce((a, s) => a + s.topicsDone, 0);
  const progress = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pb-16 space-y-10"
    >
      {/* ── Hero ── */}
      <motion.section 
        variants={staggerItem}
        className="rounded-2xl p-7 relative overflow-hidden bg-gradient-hero border border-default"
      >
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <h1 className="text-3xl font-bold mb-1 text-primary tracking-tight">
          Bom dia, {user?.email?.split('@')[0]}! 👋
        </h1>
        <div className="flex items-center gap-2 text-sm mt-1 text-secondary">
          <Clock className="w-4 h-4 text-accent" />
          <span>Banco do Brasil — <strong className="text-primary">{daysToExam} dias</strong> para a prova</span>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs mb-2 text-muted font-medium">
            <span>Progresso de leitura</span>
            <span className="text-accent font-bold">{doneTopics}/{totalTopics} módulos</span>
          </div>
          <div className="progress-track h-2">
            <motion.div 
              className="progress-fill h-2" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.section>

      {/* ── Stats ── */}
      <motion.section 
        variants={staggerContainer}
        className="grid grid-cols-2 gap-4"
      >
        {[
          { label: 'Módulos lidos', value: doneTopics, total: totalTopics, icon: BookOpen },
          { label: 'Conclusão geral', value: `${progress}%`, icon: TrendingUp },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={staggerItem}
            className="glass-card card-interactive p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-accent/10 text-accent">
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted font-medium">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* ── Matérias ── */}
      <section>
        <div className="flex items-center justify-between mb-5 px-1">
          <h2 className="text-xl font-bold text-primary tracking-tight">Suas Matérias</h2>
          <Link to="/materias" className="text-sm font-semibold flex items-center gap-1 text-accent hover:text-accent/80 transition-colors">
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="initial" 
          animate="animate" 
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {subjects.map(sub => {
            const percent = sub.topicsTotal > 0 ? Math.round((sub.topicsDone / sub.topicsTotal) * 100) : 0;
            const Icon = Icons[sub.icone] || Icons.BookOpen;

            return (
              <Link to={`/materia/${sub.id}`} key={sub.id}>
                <motion.div variants={staggerItem} className="glass-card card-interactive p-5 group">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
                      style={{ background: `${sub.cor}18`, color: sub.cor, border: `1px solid ${sub.cor}30` }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate text-primary group-hover:text-accent transition-colors">
                        {sub.nome}
                      </h3>
                      <p className="text-xs mt-0.5 text-muted">
                        {sub.topicsDone}/{sub.topicsTotal} módulos lidos
                      </p>
                    </div>
                    {percent === 100 && sub.topicsTotal > 0 && (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-success" />
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-2 text-muted font-medium">
                      <span>Leitura</span>
                      <span style={{ color: sub.cor }} className="font-bold">{percent}%</span>
                    </div>
                    <div className="progress-track h-1.5">
                      <motion.div 
                        className="progress-fill h-1.5" 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        style={{ background: sub.cor }} 
                      />
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
