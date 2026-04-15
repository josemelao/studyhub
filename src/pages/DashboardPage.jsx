import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, CheckCircle2, Loader2, TrendingUp, BookOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useSubjectsContext } from '../contexts/SubjectsContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { calculateLevel } from '../lib/levels';
import { pageVariants, staggerContainer, staggerItem } from '../lib/animations';

// Bento Components
import SmartCalendar from '../components/dashboard/SmartCalendar';
import QuickNotes from '../components/dashboard/QuickNotes';
import DailyTopics from '../components/dashboard/DailyTopics';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentWorkspaceId, workspaces } = useWorkspace();
  const { subjects, loading, fetchSubjects } = useSubjectsContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [currentConcurso, setCurrentConcurso] = useState(null);

  useEffect(() => { 
    fetchSubjects(); 
    async function loadStats() {
      if (!user || !currentWorkspaceId) return;
      
      // 1. Stats Globais (Streaks)
      const { data: g } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
      
      // 2. Stats Locais (Questões do Workspace)
      const { data: l } = await supabase.from('workspace_stats').select('*').eq('user_id', user.id).eq('workspace_id', currentWorkspaceId).single();
      
      if (g) setStats({ ...g, total_questoes_respondidas: l?.total_questoes_respondidas || 0 });

      // 3. Info do Concurso
      const workspace = workspaces.find(w => w.id === currentWorkspaceId);
      if (workspace?.concurso_id) {
        const { data: c } = await supabase.from('concursos').select('nome').eq('id', workspace.concurso_id).single();
        setCurrentConcurso(c);
      }
    }
    loadStats();
  }, [fetchSubjects, user, currentWorkspaceId, workspaces]);

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
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-primary tracking-tighter italic">
                  Bom dia, {user?.email?.split('@')[0]}!👋
                </h1>
                <div className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-black uppercase tracking-widest shadow-glow-accent">
                   Lvl {calculateLevel(stats?.pontos_xp)}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-secondary font-medium">
                <Clock className="w-4 h-4 text-accent" />
                <span className="opacity-80">{currentConcurso?.nome || 'Seu Edital'} — <strong className="text-primary">{daysToExam} dias</strong> para a prova</span>
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
              { label: 'Questões Feitas', value: stats?.total_questoes_respondidas || 0, icon: Icons.Target, color: 'text-orange-500' },
              { label: 'Streak Atual', value: `${stats?.streak_atual || 0} dias`, icon: Icons.Flame, color: 'text-yellow-500' },
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
             <SmartCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </motion.div>
          <div className="grid grid-cols-2 gap-4 h-full min-h-0">
            <motion.div variants={staggerItem} className="h-full min-h-0">
               <QuickNotes />
            </motion.div>
            <motion.div variants={staggerItem} className="h-full min-h-0">
               <DailyTopics selectedDate={selectedDate} />
            </motion.div>
          </div>
        </div>

      </div>

      {/* ── Matérias ── */}

      {/* ── Matérias ── */}
      <section className="pt-4">
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-accent rounded-full shadow-accent" />
             <h2 className="text-3xl font-black text-primary tracking-tighter italic">Suas Matérias</h2>
          </div>
          <Link to="/materias" className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-accent hover:opacity-80 transition-opacity">
            Ver Biblioteca <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="initial" 
          animate="animate" 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {subjects.map(sub => {
            const Icon = Icons[sub.icone] || Icons.BookOpen;
            const percent = sub.topicsTotal > 0 ? Math.round((sub.topicsDone / sub.topicsTotal) * 100) : 0;

            return (
              <Link to={`/materia/${sub.id}`} key={sub.id}>
                <motion.div
                  variants={staggerItem}
                  className="glass-card card-interactive p-5 group flex flex-col h-full border-white/5"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110"
                      style={{ background: `${sub.cor}15`, color: sub.cor, border: `1px solid ${sub.cor}30` }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-0.5">{sub.categoria}</p>
                      <h3 className="font-bold text-sm text-primary group-hover:text-accent transition-colors truncate leading-tight tracking-tight">
                        {sub.nome}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex justify-between text-[10px] mb-2 text-muted font-bold uppercase tracking-tight">
                      <span>{sub.topicsDone}/{sub.topicsTotal} módulos</span>
                      <span style={{ color: sub.cor }}>{percent}%</span>
                    </div>
                    <div 
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ 
                        background: percent === 0 ? 'transparent' : 'rgba(128,128,128,0.15)',
                        border: percent === 0 ? `1px solid ${sub.cor}50` : 'none'
                      }}
                    >
                      <motion.div 
                        className="h-full rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, delay: 0.1 }}
                        style={{ background: sub.cor, boxShadow: `0 0 8px ${sub.cor}50`, minWidth: percent > 0 ? '4px' : '0' }} 
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
