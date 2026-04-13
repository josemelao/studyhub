import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, CheckCircle2, Loader2, TrendingUp, BookOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubjectsContext } from '../contexts/SubjectsContext';
import { Link } from 'react-router-dom';
import { pageVariants, staggerContainer, staggerItem } from '../lib/animations';

// Bento Components
import SmartCalendar from '../components/dashboard/SmartCalendar';
import QuickNotes from '../components/dashboard/QuickNotes';
import DailyTopics from '../components/dashboard/DailyTopics';

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
      className="pb-16 space-y-8"
    >
      {/* ── BENTO GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
        
        {/* LADO ESQUERDO: Hero + Stats (2x2 total) */}
        <div className="md:col-span-2 md:row-span-2 grid grid-rows-[1.3fr_0.7fr] gap-4">
          {/* Card 1: Hero & Progress */}
          <motion.section 
            variants={staggerItem}
            className="rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-accent/20 to-primary border border-accent/10 flex flex-col justify-between"
          >
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
            
            <div>
              <h1 className="text-3xl font-black mb-1 text-primary tracking-tighter italic">
                Bom dia, {user?.email?.split('@')[0]}! 👋
              </h1>
              <div className="flex items-center gap-3 text-xs mt-1 text-secondary font-medium">
                <Clock className="w-4 h-4 text-accent" />
                <span className="opacity-80">Banco do Brasil — <strong className="text-primary">{daysToExam} dias</strong> para a prova</span>
              </div>
            </div>

            <div className="mt-4 bg-white/[0.03] p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted">Progresso Atual</span>
                <span className="text-xs text-accent font-bold">{doneTopics}/{totalTopics} módulos</span>
              </div>
              <div className="progress-track h-2.5 bg-white/5">
                <motion.div 
                  className="progress-fill h-2.5 shadow-glow-accent" 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.section>

          {/* Card 2: Stats Grid 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Módulos lidos', value: doneTopics, icon: BookOpen, color: 'text-accent' },
              { label: 'Conclusão geral', value: `${progress}%`, icon: TrendingUp, color: 'text-success' },
              { label: 'Questões Feitas', value: '342', icon: Icons.Target, color: 'text-orange-500' },
              { label: 'Semanas Ativo', value: '4', icon: Icons.Zap, color: 'text-yellow-500' },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                variants={staggerItem}
                className="glass-card p-4 flex items-center gap-4 border-white/5 bg-white/[0.01]"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 ${stat.color} shrink-0`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-lg font-black text-primary leading-none">{stat.value}</div>
                  <div className="text-[9px] text-muted font-bold uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* LADO DIREITO: Calendar + Note + Tasks */}
        <div className="md:col-span-2 md:row-span-2 grid grid-rows-[0.7fr_1.3fr] gap-4">
          <motion.div variants={staggerItem} className="h-full overflow-hidden">
             <SmartCalendar />
          </motion.div>
          <div className="grid grid-cols-2 gap-4 h-full">
            <motion.div variants={staggerItem} className="h-full">
               <QuickNotes />
            </motion.div>
            <motion.div variants={staggerItem} className="h-full">
               <DailyTopics />
            </motion.div>
          </div>
        </div>

      </div>

      {/* ── Matérias ── */}

      {/* ── Matérias ── */}
      <section className="pt-4">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
             <div className="w-1 h-6 bg-accent rounded-full" />
             <h2 className="text-2xl font-black text-primary tracking-tighter italic">Suas Matérias</h2>
          </div>
          <Link to="/materias" className="text-sm font-bold flex items-center gap-2 text-accent hover:opacity-80 transition-opacity">
            Gerenciar Matérias <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="initial" 
          animate="animate" 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {subjects.map(sub => {
            const percent = sub.topicsTotal > 0 ? Math.round((sub.topicsDone / sub.topicsTotal) * 100) : 0;
            const Icon = Icons[sub.icone] || Icons.BookOpen;

            return (
              <Link to={`/materia/${sub.id}`} key={sub.id}>
                <motion.div variants={staggerItem} className="glass-card card-interactive !p-0 group overflow-hidden border-white/5">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500"
                        style={{ background: `${sub.cor}15`, color: sub.cor, border: `1px solid ${sub.cor}30` }}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {percent === 100 && sub.topicsTotal > 0 && (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-success" />
                      )}
                    </div>
                    
                    <h3 className="font-black text-lg text-primary group-hover:text-accent transition-colors tracking-tight mb-1">
                      {sub.nome}
                    </h3>
                    <p className="text-xs text-muted font-medium">
                      {sub.topicsDone} de {sub.topicsTotal} módulos concluídos
                    </p>
                  </div>

                  <div className="px-6 pb-6 mt-auto">
                    <div className="flex justify-between text-[10px] mb-2 text-muted font-black uppercase tracking-widest">
                      <span>Progresso</span>
                      <span style={{ color: sub.cor }}>{percent}%</span>
                    </div>
                    <div className="progress-track h-2 bg-white/5">
                      <motion.div 
                        className="progress-fill h-2" 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1.2, delay: 0.2 }}
                        style={{ background: sub.cor, boxShadow: `0 0 10px ${sub.cor}40` }} 
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
