import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, Calendar } from 'lucide-react';
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
import SubjectProgressChart from '../components/progress/SubjectProgressChart';
import AchievementsGrid from '../components/progress/AchievementsGrid';

export default function ProgressPage() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { subjects, fetchSubjects } = useSubjectsContext();
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, all
  
  const [rawStats, setRawStats] = useState({
    global: null,
    workspace: null,
    quizzes: [],
    exams: []
  });

  useEffect(() => {
    async function fetchData() {
      if (!user || !currentWorkspaceId) return;
      try {
        setLoading(true);

        // 1. Fetch Basic Stats (XP, Streaks)
        const { data: globalStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // 2. Fetch Workspace Stats (Total Q, Accuracy, Achievements)
        const { data: localStats } = await supabase
          .from('workspace_stats')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .single();

        // 3. Fetch All Quiz Sessions for the workspace
        const { data: quizData } = await supabase
          .from('quiz_sessions')
          .select('questions_total, questions_correct, score_percent, completed_at, topic_id, topics(nome, subject_id, subjects(nome, cor))')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .order('completed_at', { ascending: true });

        // 4. Fetch All Finalized Exam Sessions
        const { data: examData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'finalizada')
          .order('finalizada_em', { ascending: true });

        setRawStats({
          global: globalStats,
          workspace: localStats,
          quizzes: quizData || [],
          exams: examData || []
        });

        // Ensure subjects are loaded
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

  // 1. Progress KPIs
  const kpis = useMemo(() => {
    const totalQ = rawStats.workspace?.total_questoes_respondidas || 0;
    const totalC = rawStats.workspace?.total_acertos || 0;
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
      dailyData[date].quizSum += q.score_percent;
      dailyData[date].quizCount += 1;
    });

    // Group exams by date
    filteredStats.exams.forEach(e => {
      const date = new Date(e.finalizada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dailyData[date]) dailyData[date] = { date, quizSum: 0, quizCount: 0, examSum: 0, examCount: 0 };
      dailyData[date].examSum += e.score_percent;
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
      dailyVolume[date].count += q.questions_total;
    });
    return Object.values(dailyVolume);
  }, [filteredStats]);

  // 4. Exam Performance (Bar Chart)
  const examPerformance = useMemo(() => {
    return filteredStats.exams.map(e => ({
      date: new Date(e.finalizada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      score: e.score_percent
    }));
  }, [filteredStats]);

  // 5. Subject Accuracy (Horizontal Bar Chart)
  const subjectAccuracy = useMemo(() => {
    const subStats = {};
    rawStats.quizzes.forEach(q => {
      const subName = q.topics?.subjects?.nome;
      const subColor = q.topics?.subjects?.cor;
      if (!subName) return;
      if (!subStats[subName]) subStats[subName] = { name: subName, color: subColor, sum: 0, count: 0 };
      subStats[subName].sum += q.score_percent;
      subStats[subName].count += 1;
    });

    return Object.values(subStats)
      .map(s => ({ ...s, accuracy: Math.round(s.sum / s.count) }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 8);
  }, [rawStats]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-36 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted">Processando estatísticas avançadas...</p>
      </div>
    );
  }

  return (
    <motion.div 
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
        <PerformanceEvolutionChart data={performanceTrend} />

        {/* 3. Volume & Exams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PracticeVolumeChart data={practiceVolume} />
          <ExamPerformanceChart data={examPerformance} />
        </div>

        {/* 4. Subject Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubjectAccuracyChart data={subjectAccuracy} />
          <SubjectProgressChart data={subjectProgress} />
        </div>

        {/* 5. Achievements */}
        <AchievementsGrid conquistas={rawStats.workspace?.conquistas || []} />
      </motion.div>
    </motion.div>
  );
}
