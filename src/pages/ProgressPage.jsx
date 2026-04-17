import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Loader2, Calendar, LayoutGrid, Radar as RadarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useSubjectsContext } from '../contexts/SubjectsContext';
import { pageVariants, staggerItem, staggerContainer } from '../lib/animations';

// components
import ProgressKpis from '../components/progress/ProgressKpis';
import PerformanceEvolutionChart from '../components/progress/PerformanceEvolutionChart';
import PracticeVolumeChart from '../components/progress/PracticeVolumeChart';
import ExamPerformanceChart from '../components/progress/ExamPerformanceChart';
import SubjectAccuracyChart from '../components/progress/SubjectAccuracyChart';
import SubjectRadarChart from '../components/progress/SubjectRadarChart';
import SubjectProgressChart from '../components/progress/SubjectProgressChart';
import AchievementsGrid from '../components/progress/AchievementsGrid';

export default function ProgressPage() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { subjects, fetchSubjects } = useSubjectsContext();
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, all
  const [viewMode, setViewMode] = useState('bar'); // bar, radar
  
  const [rawStats, setRawStats] = useState({
    global: null,
    workspace: null,
    quizzes: [],
    exams: [],
    questionsMeta: {} // pergunta_id -> { subject_nome, subject_cor, resposta_correta }
  });

  useEffect(() => {
    async function fetchData() {
      if (!user || !currentWorkspaceId) return;
      try {
        setLoading(true);

        // 1. Fetch current workspace to get the concurso_id
        const { data: currentWs } = await supabase
          .from('workspaces')
          .select('concurso_id')
          .eq('id', currentWorkspaceId)
          .maybeSingle();

        const concursoId = currentWs?.concurso_id;

        // 2. Fetch ALL Workspaces for this concurso (to unify "por edital")
        let workspaceIds = [currentWorkspaceId];
        if (concursoId) {
          const { data: siblingWorkspaces } = await supabase
            .from('workspaces')
            .select('id')
            .eq('user_id', user.id)
            .eq('concurso_id', concursoId);
          if (siblingWorkspaces) {
            workspaceIds = siblingWorkspaces.map(w => w.id);
          }
        }

        // 3. Fetch Global Stats (XP, Streaks)
        const { data: globalStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // 4. Fetch Workspace Stats (Achievements focus - using current workspace)
        const { data: localStats } = await supabase
          .from('workspace_stats')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .maybeSingle();

        // 5. Fetch All Quiz Sessions for the UNIFIED workspaces
        const { data: quizData } = await supabase
          .from('quiz_sessions')
          .select('questions_total, questions_correct, score_percent, completed_at, topic_id, topics(nome, subject_id, subjects(nome, cor))')
          .eq('user_id', user.id)
          .in('workspace_id', workspaceIds)
          .order('completed_at', { ascending: true });

        // 6. Fetch All Finalized Exam Sessions for the UNIFIED workspaces
        const { data: examData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('user_id', user.id)
          .in('workspace_id', workspaceIds)
          .eq('status', 'finalizada')
          .order('finalizada_em', { ascending: true });

        // 7. Fetch Question Metadata for Exam Breakdown
        const examQuestionsIds = [...new Set((examData || []).flatMap(e => Object.keys(e.respostas || {})))];
        let questionsMeta = {};
        
        if (examQuestionsIds.length > 0) {
          const { data: qMeta } = await supabase
            .from('questions')
            .select(`
              id, 
              resposta_correta,
              topics (
                subject_id,
                subjects (nome, cor)
              )
            `)
            .in('id', examQuestionsIds);
            
          if (qMeta) {
            qMeta.forEach(q => {
              questionsMeta[q.id] = {
                resposta_correta: q.resposta_correta,
                subject_nome: q.topics?.subjects?.nome,
                subject_cor: q.topics?.subjects?.cor
              };
            });
          }
        }

        setRawStats({
          global: globalStats,
          workspace: localStats,
          quizzes: quizData || [],
          exams: examData || [],
          questionsMeta
        });

        fetchSubjects();
      } catch (err) {
        console.error('Error fetching progress data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, currentWorkspaceId, fetchSubjects]);

  // --- Data Transformation Logic ---

  const filteredStats = useMemo(() => {
    const now = new Date();
    let limitDate = new Date();
    
    if (timeRange === '7d') limitDate.setDate(now.getDate() - 7);
    else if (timeRange === '30d') limitDate.setDate(now.getDate() - 30);
    else if (timeRange === '90d') limitDate.setDate(now.getDate() - 90);
    else limitDate = new Date(0); // All time

    const quizzes = rawStats.quizzes.filter(q => new Date(q.completed_at) >= limitDate);
    const exams = rawStats.exams.filter(e => new Date(e.finalizada_em) >= limitDate);

    return { quizzes, exams };
  }, [rawStats, timeRange]);

  // 1. Progress KPIs (Calculated from RAW sessions for 100% accuracy)
  const kpis = useMemo(() => {
    // Somar quizzes
    const qTotal = rawStats.quizzes.reduce((acc, q) => acc + (q.questions_total || 0), 0);
    const qCorrect = rawStats.quizzes.reduce((acc, q) => acc + (q.questions_correct || 0), 0);
    
    // Somar simulados (usando colunas novas se existirem, ou fallback)
    const eTotal = rawStats.exams.reduce((acc, e) => acc + (e.questions_total || e.questoes?.length || 0), 0);
    const eCorrect = rawStats.exams.reduce((acc, e) => acc + (e.questions_correct || 0), 0);

    const totalQ = qTotal + eTotal;
    const totalC = qCorrect + eCorrect;
    const accuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;

    return {
      accuracy,
      totalQ,
      totalExams: rawStats.exams.length,
      streakAtual: rawStats.global?.streak_atual || 0
    };
  }, [rawStats]);

  // 2. Performance Evolution (Line Chart)
  const performanceTrend = useMemo(() => {
    const dailyData = {};

    // Group quizzes by date
    filteredStats.quizzes.forEach(q => {
      const date = new Date(q.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dailyData[date]) dailyData[date] = { date, quizSum: 0, quizCount: 0, examSum: 0, examCount: 0 };
      dailyData[date].quizSum += (q.score_percent || 0);
      dailyData[date].quizCount += 1;
    });

    // Group exams by date
    filteredStats.exams.forEach(e => {
      const date = new Date(e.finalizada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dailyData[date]) dailyData[date] = { date, quizSum: 0, quizCount: 0, examSum: 0, examCount: 0 };
      dailyData[date].examSum += (e.score_percent || 0);
      dailyData[date].examCount += 1;
    });

    return Object.values(dailyData).map(d => ({
      date: d.date,
      quizScore: d.quizCount > 0 ? Math.round(d.quizSum / d.quizCount) : null,
      examScore: d.examCount > 0 ? Math.round(d.examSum / d.examCount) : null
    }));
  }, [filteredStats]);

  // 3. Practice Volume (Bar Chart)
  const practiceVolume = useMemo(() => {
    const dailyVolume = {};
    
    filteredStats.quizzes.forEach(q => {
      const date = new Date(q.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dailyVolume[date]) dailyVolume[date] = { date, count: 0 };
      dailyVolume[date].count += (q.questions_total || 0);
    });

    filteredStats.exams.forEach(e => {
      const date = new Date(e.finalizada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dailyVolume[date]) dailyVolume[date] = { date, count: 0 };
      dailyVolume[date].count += (e.questions_total || e.questoes?.length || 0);
    });

    return Object.values(dailyVolume);
  }, [filteredStats]);

  // 4. Exam Performance (Bar Chart - Individual Side-by-Side)
  const examPerformance = useMemo(() => {
    return filteredStats.exams.map((e, index) => ({
      id: e.id,
      name: `Simulado ${index + 1}`,
      date: new Date(e.finalizada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      score: e.score_percent || 0
    }));
  }, [filteredStats]);

  // 5. Subject Accuracy (Horizontal Bar Chart / Radar Chart - Unified)
  const subjectAccuracy = useMemo(() => {
    const subStats = {};
    
    // Process Quizzes
    filteredStats.quizzes.forEach(q => {
      const subName = q.topics?.subjects?.nome;
      const subColor = q.topics?.subjects?.cor;
      if (!subName) return;
      if (!subStats[subName]) subStats[subName] = { name: subName, color: subColor, sum: 0, count: 0 };
      subStats[subName].sum += (q.score_percent || 0);
      subStats[subName].count += 1;
    });

    // Process Exams (Question by Question Breakdown)
    filteredStats.exams.forEach(e => {
      const resp = e.respostas || {};
      Object.entries(resp).forEach(([qId, userAns]) => {
        const meta = rawStats.questionsMeta[qId];
        if (!meta || !meta.subject_nome) return;
        
        const subName = meta.subject_nome;
        const subColor = meta.subject_cor;
        
        if (!subStats[subName]) subStats[subName] = { name: subName, color: subColor, sum: 0, count: 0 };
        
        // Em simulados tratamos cada questão como 0 ou 100% de acerto para a média
        const isCorrect = userAns === meta.resposta_correta;
        subStats[subName].sum += isCorrect ? 100 : 0;
        subStats[subName].count += 1;
      });
    });

    return Object.values(subStats)
      .map(s => ({ ...s, accuracy: Math.round(s.sum / s.count) }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 8);
  }, [filteredStats, rawStats.questionsMeta]);

  // 6. Subject Progress (Horizontal Bar Chart)
  const subjectProgress = useMemo(() => {
    return subjects
      .map(s => ({
        name: s.nome,
        progress: s.topicsTotal > 0 ? Math.round((s.topicsDone / s.topicsTotal) * 100) : 0,
        topicsDone: s.topicsDone,
        topicsTotal: s.topicsTotal
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 8);
  }, [subjects]);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div 
          key="progress-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-40 gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted">Processando estatísticas avançadas...</p>
        </motion.div>
      ) : (
        <motion.div 
          key="progress-page-content"
          variants={pageVariants} 
          initial="initial" 
          animate="animate" 
          exit="exit" 
          className="pb-24 space-y-10"
        >
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-10">
        {/* Header with Period Filter */}
        <motion.section variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black text-primary tracking-tighter italic">Meu Progresso</h1>
            </div>
            <p className="text-sm text-muted ml-16 font-medium">Acompanhe sua evolução, consistência e desempenho por matéria.</p>
          </div>

          <div className="flex bg-secondary p-1 rounded-2xl border border-default self-start">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: 'all', label: 'Tudo' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                  timeRange === range.id 
                  ? 'bg-accent text-white shadow-glow-accent' 
                  : 'text-muted hover:text-primary'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </motion.section>

        {/* 1. KPIs */}
        <ProgressKpis stats={kpis} />

        {/* 2. Main Evolution Chart */}
        <motion.div variants={staggerItem}>
          <PerformanceEvolutionChart data={performanceTrend} />
        </motion.div>

        {/* 3. Volume & Exams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={staggerItem}>
            <PracticeVolumeChart data={practiceVolume} />
          </motion.div>
          <motion.div variants={staggerItem}>
            <ExamPerformanceChart data={examPerformance} />
          </motion.div>
        </div>

        {/* 4. Subject Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={staggerItem}>
            <SubjectAccuracyChart 
              data={subjectAccuracy} 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <SubjectProgressChart data={subjectProgress} />
          </motion.div>
        </div>

        {/* 5. Achievements */}
        <AchievementsGrid conquistas={rawStats.workspace?.conquistas || []} />
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
