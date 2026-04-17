import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Clock, CheckCircle2, Loader2, TrendingUp, Target } from 'lucide-react';
import * as Icons from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
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

const RADIAN = Math.PI / 180;

export default function DashboardPage() {
  const { user } = useAuth();
  const MotionDiv = motion.div;
  const { currentWorkspaceId, workspaces } = useWorkspace();
  const { subjects, loading, fetchSubjects } = useSubjectsContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentConcurso, setCurrentConcurso] = useState(null);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [outlineOpacityById, setOutlineOpacityById] = useState({});
  const outlineOpacityRef = useRef({});
  const outlineAnimationFrameRef = useRef(null);

  const handleActivateSubject = useCallback((dataset, index) => {
    const subjectId = dataset[index]?.id;
    if (subjectId) {
      setActiveSubjectId(subjectId);
    }
  }, []);

  const handleClearActiveSubject = useCallback(() => {
    setActiveSubjectId(null);
  }, []);

  useEffect(() => {
    outlineOpacityRef.current = outlineOpacityById;
  }, [outlineOpacityById]);

  useEffect(() => {
    const allSliceIds = [...new Set([...subjects.map((subject) => subject.id), ...Object.keys(outlineOpacityRef.current)])];

    if (!allSliceIds.length) return undefined;

    const from = {};
    const to = {};

    allSliceIds.forEach((id) => {
      from[id] = outlineOpacityRef.current[id] ?? 0;
      to[id] = id === activeSubjectId ? 1 : 0;
    });

    const duration = 160;
    const start = performance.now();
    const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

    if (outlineAnimationFrameRef.current) {
      cancelAnimationFrame(outlineAnimationFrameRef.current);
    }

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutQuad(progress);
      const next = {};

      allSliceIds.forEach((id) => {
        next[id] = from[id] + (to[id] - from[id]) * eased;
      });

      outlineOpacityRef.current = next;
      setOutlineOpacityById(next);

      if (progress < 1) {
        outlineAnimationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    outlineAnimationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (outlineAnimationFrameRef.current) {
        cancelAnimationFrame(outlineAnimationFrameRef.current);
      }
    };
  }, [activeSubjectId, subjects]);

  const renderSyncedSlice = useCallback((props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const outlineOpacity = outlineOpacityById[payload?.id] ?? 0;
    const labelRadius = outerRadius + 16;
    const labelX = cx + labelRadius * Math.cos(-midAngle * RADIAN);
    const labelY = cy + labelRadius * Math.sin(-midAngle * RADIAN);
    const textAnchor = labelX > cx ? 'start' : 'end';

    if (outlineOpacity <= 0.001) {
      return (
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      );
    }

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 3}
          outerRadius={outerRadius + 6}
          fill={fill}
          fillOpacity={0.7 * outlineOpacity}
          stroke={fill}
          strokeOpacity={outlineOpacity}
          strokeWidth={1}
        />
        <text
          x={labelX}
          y={labelY}
          fill={fill}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize={11}
          fontWeight={900}
          opacity={outlineOpacity}
        >
          {payload?.slicePercent}%
        </text>
      </g>
    );
  }, [outlineOpacityById]);

  useEffect(() => { 
    fetchSubjects(); 
    async function loadStats() {
      if (!user || !currentWorkspaceId) return;
      try {
        setLoadingStats(true); // Start loading
        
        // 1. Stats Globais (Streaks)
        const { data: g } = await supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle();
        
        // 2. Perfil & Stats Locais (Questões & Simulados do Workspace)
        const [profileRes, quizSessionsRes, examSessionsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase
            .from('quiz_sessions')
            .select('questions_correct, questions_total')
            .eq('user_id', user.id)
            .eq('workspace_id', currentWorkspaceId),
          supabase
            .from('exam_sessions')
            .select('score_percent, questions_total, questions_correct')
            .eq('user_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'finalizada')
        ]);

        const quizSessions = quizSessionsRes.data || [];
        const examSessions = examSessionsRes.data || [];
        if (profileRes.data) setProfile(profileRes.data);

        // Cálculo de Questões de Prática (Quizzes)
        const totalQuestoesPratica = quizSessions.reduce((acc, s) => acc + (s.questions_total || 0), 0);
        const totalAcertosPratica = quizSessions.reduce((acc, s) => acc + (s.questions_correct || 0), 0);
        const mediaAcertoQuestoes = totalQuestoesPratica > 0 
          ? Math.round((totalAcertosPratica / totalQuestoesPratica) * 100) 
          : null;

        // Cálculo de Simulados
        const totalSimulados = examSessions.length;
        const mediaAcertoSimulados = totalSimulados > 0
          ? Math.round(examSessions.reduce((acc, session) => acc + (session.score_percent || 0), 0) / totalSimulados)
          : null;

        if (g) {
          setStats({
            ...g,
            total_questoes_respondidas: totalQuestoesPratica,
            media_acerto_questoes: mediaAcertoQuestoes,
            total_simulados_finalizados: totalSimulados,
            media_acerto_simulados: mediaAcertoSimulados,
          });
        }

        // 3. Info do Concurso
        const workspace = workspaces.find(w => w.id === currentWorkspaceId);
        if (workspace?.concurso_id) {
          const { data: c } = await supabase.from('concursos').select('nome').eq('id', workspace.concurso_id).single();
          setCurrentConcurso(c);
        }
      } finally {
        setLoadingStats(false); // Finish loading
      }
    }
    loadStats();
  }, [fetchSubjects, user, currentWorkspaceId, workspaces]);

  const daysToExam = 68;

  const isPageLoading = loading || loadingStats;

  return (
    <AnimatePresence mode="wait">
      {isPageLoading ? (
        <motion.div 
          key="dashboard-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-40 gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted">Carregando painel estratégico...</p>
        </motion.div>
      ) : (
        <motion.div 
          key="dashboard-page"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="pb-16 space-y-8"
        >
          {/* Cálculo de Dados */}
          {(() => {
            const totalTopics = subjects.reduce((a, s) => a + s.topicsTotal, 0);
            const doneTopics  = subjects.reduce((a, s) => a + s.topicsDone, 0);

            const editalData = subjects
              .filter(s => s.topicsTotal > 0)
              .map(s => ({
                id: s.id,
                name: s.nome,
                value: s.topicsTotal,
                color: s.cor,
                slicePercent: totalTopics > 0 ? Math.round((s.topicsTotal / totalTopics) * 100) : 0,
              }));

            const alunoData = subjects
              .filter(s => s.topicsDone > 0)
              .map(s => ({
                id: s.id,
                name: s.nome,
                value: s.topicsDone,
                color: s.cor,
                slicePercent: doneTopics > 0 ? Math.round((s.topicsDone / doneTopics) * 100) : 0,
              }));
              
            const activeSubject = subjects.find(s => s.id === activeSubjectId);
            const statsCards = [
              { label: 'Questões Respondidas', value: stats?.total_questoes_respondidas || 0, icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { label: 'Simulados Feitos', value: stats?.total_simulados_finalizados || 0, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
              { label: 'Acerto Médio em Questões', value: stats?.media_acerto_questoes != null ? `${stats.media_acerto_questoes}%` : '--', icon: Icons.Crosshair, color: 'text-accent', bg: 'bg-accent/10' },
              { label: 'Acerto Médio em Simulados', value: stats?.media_acerto_simulados != null ? `${stats.media_acerto_simulados}%` : '--', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            ];

            return (
              <>
                {/* ── BENTO GRID ── */}
                <motion.div 
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]"
                >
        
        {/* LADO ESQUERDO: Hero + Stats (2x2 total) */}
        <motion.div variants={staggerContainer} className="md:col-span-2 md:row-span-2 grid grid-rows-[1.3fr_0.7fr] gap-4">
          {/* Card 1: Hero & Progress */}
          <motion.div 
            variants={staggerItem}
            className="rounded-3xl p-6 relative overflow-hidden bg-secondary border border-default flex flex-col justify-between shadow-sm"
          >
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-primary tracking-tighter italic">
                  Bom dia, {profile?.display_name || user?.email?.split('@')[0]}!👋
                </h1>
                <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest shadow-glow-accent">
                   Lvl {calculateLevel(stats?.pontos_xp)}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-secondary font-medium">
                <Clock className="w-4 h-4 text-accent" />
                <span className="opacity-80">{currentConcurso?.nome || 'Seu Edital'} — <strong className="text-primary">{daysToExam} dias</strong> para a prova</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div
                className="grid grid-cols-2 gap-4 h-48 md:h-56 lg:h-64"
                onMouseLeave={handleClearActiveSubject}
                onPointerLeave={handleClearActiveSubject}
              >
                {/* Pizza 1: Edital */}
                <div className="relative group h-full" onMouseLeave={handleClearActiveSubject}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-2 text-center overflow-hidden">
                    <AnimatePresence mode="wait">
                      {activeSubject ? (
                        <motion.div 
                          key={`active-${activeSubject.id}`}
                          initial={{ opacity: 0, scale: 0.9, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col items-center justify-center max-w-[110px] -mt-1"
                        >
                          <span className="text-[10px] font-black uppercase tracking-tight leading-tight whitespace-normal break-words mb-1" style={{ color: activeSubject.cor }}>
                             {activeSubject.nome}
                          </span>
                          <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter italic leading-none my-0.5">
                            {activeSubject.topicsTotal}
                          </span>
                          <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Tópicos Totais</span>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="default-edital"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col items-center justify-center"
                        >
                          <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter italic leading-none">{totalTopics}</span>
                          <span className="text-[9px] md:text-[10px] font-black text-muted uppercase tracking-widest mt-1">Tópicos Totais</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 15, bottom: 0, left: 15 }}>
                      <Pie
                        data={editalData}
                        shape={renderSyncedSlice}
                        innerRadius="60%"
                        outerRadius="82%"
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                        onMouseEnter={(_, index) => handleActivateSubject(editalData, index)}
                        onMouseLeave={handleClearActiveSubject}
                      >
                        {editalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Pizza 2: Realidade */}
                <div className="relative group h-full" onMouseLeave={handleClearActiveSubject}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-2 text-center overflow-hidden">
                    <AnimatePresence mode="wait">
                      {activeSubject ? (
                        <motion.div 
                          key={`active-realidade-${activeSubject.id}`}
                          initial={{ opacity: 0, scale: 0.9, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col items-center justify-center max-w-[110px] -mt-1"
                        >
                          <span className="text-[10px] font-black uppercase tracking-tight leading-tight whitespace-normal break-words mb-1" style={{ color: activeSubject.cor }}>
                             {activeSubject.nome}
                          </span>
                          <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter italic leading-none my-0.5">
                            {activeSubject.topicsDone}
                          </span>
                          <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Tópicos Concluídos</span>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="default-realidade"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col items-center justify-center"
                        >
                          <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter italic leading-none">{doneTopics}</span>
                          <span className="text-[9px] md:text-[10px] font-black text-muted uppercase tracking-widest mt-1">Tópicos Concluídos</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 15, bottom: 0, left: 15 }}>
                      <Pie
                        data={alunoData}
                        shape={renderSyncedSlice}
                        innerRadius="60%"
                        outerRadius="82%"
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                        onMouseEnter={(_, index) => handleActivateSubject(alunoData, index)}
                        onMouseLeave={handleClearActiveSubject}
                      >
                        {alunoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-4">
            {statsCards.map((stat, i) => (
              <motion.div 
                key={i} 
                variants={staggerItem}
                className="glass-card p-6 flex items-center gap-6 border-default bg-secondary"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-primary leading-none">{stat.value}</div>
                  <div className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* LADO DIREITO: Calendar + Note + Tasks */}
        <motion.div variants={staggerContainer} className="md:col-span-2 md:row-span-2 grid grid-rows-[0.7fr_1.3fr] gap-4">
          <motion.div variants={staggerItem} className="h-full overflow-hidden">
             <SmartCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </motion.div>
          <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-4 h-full min-h-0">
            <motion.div variants={staggerItem} className="h-full min-h-0">
               <QuickNotes />
            </motion.div>
            <motion.div variants={staggerItem} className="h-full min-h-0">
                <DailyTopics selectedDate={selectedDate} />
            </motion.div>
          </motion.div>
        </motion.div>

      </motion.div>

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
                      <span>{sub.topicsDone}/{sub.topicsTotal} tópicos</span>
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
              </>
            );
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

