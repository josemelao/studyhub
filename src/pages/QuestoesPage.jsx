import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Loader2, CircleHelp,
  PenTool, Target, RotateCcw, ArrowLeft, Check
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useGamification } from '../hooks/useGamification';
import { pageVariants, staggerContainer, staggerItem, scaleIn, expandDown } from '../lib/animations';
import FavoriteButton from '../components/ui/FavoriteButton';
import { toast } from 'react-hot-toast';

export default function QuestoesPage() {
  const { user } = useAuth();
  const { currentWorkspaceId, currentConcursoId } = useWorkspace();
  const { processActivity } = useGamification();
  const [view, setView] = useState('list');
  const [subjects, setSubjects] = useState([]);
  const [openSubject, setOpenSubject] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const [sessionHistory, setSessionHistory] = useState([]);
  const [savedSession, setSavedSession] = useState(null);

  useEffect(() => {
    async function load() {
      if (!user || !currentConcursoId) return;
      try {
        setLoadingSubjects(true);
        const { data, error } = await supabase
          .from('subjects')
          .select('id, nome, cor, icone, categoria, ordem, sub_subjects(id, nome, ordem, topics(id, nome, ordem))')
          .eq('concurso_id', currentConcursoId)
          .order('ordem');
        if (error) throw error;

        const subjectsData = data || [];
        const topicIds = subjectsData
          .flatMap(subject => subject.sub_subjects || [])
          .flatMap(ss => ss.topics || [])
          .map(topic => topic.id);

        const uniqueTopicIds = [...new Set(topicIds)];
        let filteredSubjects = subjectsData;

        if (uniqueTopicIds.length > 0) {
          const { data: questionRows, error: questionError } = await supabase
            .from('questions')
            .select('topic_id')
            .in('topic_id', uniqueTopicIds);
          if (questionError) throw questionError;

          const validTopicIds = new Set((questionRows || []).map(q => q.topic_id));

          filteredSubjects = subjectsData
            .map(subject => ({
              ...subject,
              sub_subjects: (subject.sub_subjects || [])
                .map(ss => ({
                  ...ss,
                  topics: (ss.topics || []).filter(topic => validTopicIds.has(topic.id))
                }))
                .filter(ss => (ss.topics || []).length > 0)
            }))
            .filter(subject => (subject.sub_subjects || []).length > 0);
        } else {
          filteredSubjects = [];
        }

        setSubjects(filteredSubjects);
      } catch (err) { console.error(err); }
      finally { setLoadingSubjects(false); }
    }
    load();
  }, [user, currentConcursoId]);


  const startQuiz = async (topic) => {
    try {
      setLoadingQuiz(true);
      setSelectedTopic(topic);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setSessionAnswers([]);

      const { data: qData, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topic.id);
      if (error) throw error;
      if (!qData?.length) { 
        toast.error('Nenhuma questão cadastrada para este tópico.', { icon: '🔍' }); 
        setLoadingQuiz(false); 
        return; 
      }
      setQuestions([...qData].sort(() => Math.random() - 0.5));
      setView('quiz');
    } catch (err) { console.error(err); }
    finally { setLoadingQuiz(false); }
  };

  const handleAnswer = () => {
    if (!selectedAnswer || isAnswered) return;
    const q = questions[currentIndex];
    const correct = selectedAnswer === q.resposta_correta;
    setIsAnswered(true);
    setSessionAnswers(prev => [...prev, { questionId: q.id, isCorrect: correct }]);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      await finishQuiz();
    }
  };

  const finishQuiz = async () => {
  const answers = sessionAnswers;
  const total = questions.length;
  const correct = answers.filter(a => a.isCorrect).length;
  const scorePercent = Math.round((correct / total) * 100);

  // ── MOSTRAR RESULTADO IMEDIATAMENTE (UI Responsiva) ──
  setSavedSession({ total, correct, scorePercent });
  setView('result');

  // ── PROCESSAR EM BACKGROUND (Não bloqueia UI) ──
  try {
    // 1. Salvar sessão
    await supabase.from('quiz_sessions').insert({
      user_id: user.id, 
      workspace_id: currentWorkspaceId,
      topic_id: selectedTopic.id,
      questions_total: total, 
      questions_correct: correct, 
      score_percent: scorePercent
    });

    // 2. Processar gamificação
    await processActivity({
      questoes: total,
      acertos: correct
    });

    // 3. Carregar histórico
    const { data: hist } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', currentWorkspaceId)
      .eq('topic_id', selectedTopic.id)
      .order('completed_at', { ascending: false })
      .limit(10);
    setSessionHistory(hist || []);
  } catch (err) { 
    console.error('Erro ao processar resultado em background:', err);
    // Erro silencioso — resultado já foi exibido
  }
};

  const resetToList = () => {
    setView('list'); setSelectedTopic(null); setQuestions([]);
    setSavedSession(null); setSessionHistory([]); setSessionAnswers([]);
  };

  const currentQ = questions[currentIndex];

  // ── LIST ──
  if (view === 'list') {
    if (loadingSubjects) return (
      <div className="flex flex-col items-center justify-center py-36 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted">Carregando matérias...</p>
      </div>
    );

    return (
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="pb-20 space-y-8"
      >
        <motion.section variants={staggerItem}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
              <CircleHelp className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">Questões</h1>
          </div>
          <p className="text-sm text-muted ml-14">
            Escolha um tópico para praticar e testar seus conhecimentos.
          </p>
        </motion.section>

        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
          {subjects.map(subject => {
            const Icon = Icons[subject.icone] || Icons.BookOpen;
            const isOpen = openSubject === subject.id;

            return (
              <motion.div key={subject.id} variants={staggerItem} className="glass-card overflow-hidden !p-0">
                <button
                  onClick={() => setOpenSubject(isOpen ? null : subject.id)}
                  className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-all duration-300 ${
                    isOpen ? 'bg-accent/5' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: `${subject.cor}15`, color: subject.cor, border: `1px solid ${subject.cor}30` }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`flex-1 font-bold text-base ${isOpen ? 'text-accent' : 'text-primary'}`}>
                    {subject.nome}
                  </span>
                  <div className={`p-1 rounded-lg transition-transform duration-300 ${isOpen ? 'rotate-180 bg-accent/20 text-accent' : 'text-muted'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      variants={expandDown}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="overflow-hidden border-t border-default bg-secondary/30"
                    >
                      {(subject.sub_subjects || []).sort((a,b) => a.ordem - b.ordem).map(ss => (
                        <div key={ss.id}>
                          <div className="px-6 py-2.5 bg-white/[0.03]">
                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-muted">
                              {ss.nome}
                            </span>
                          </div>
                          {(ss.topics || []).sort((a,b) => a.ordem - b.ordem).map(topic => (
                            <div key={topic.id}
                              className="flex items-center justify-between px-6 md:px-14 py-4 border-t border-subtle hover:bg-white/[0.02] transition-colors group"
                            >
                              <span className="text-base font-bold text-primary group-hover:text-accent transition-colors">{topic.nome}</span>
                              <button
                                onClick={() => startQuiz(topic)}
                                disabled={loadingQuiz}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-accent-subtle text-accent border border-accent-border hover:bg-accent/20 transition-all shadow-sm"
                              >
                                {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Iniciar Prática <ChevronRight className="w-4 h-4" /></>}
                              </button>
                            </div>
                          ))}
                          {(!ss.topics?.length) && (
                            <div className="px-14 py-4 text-sm text-muted border-t border-subtle">
                              Nenhum tópico disponível.
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    );
  }

  // ── QUIZ ──
  if (view === 'quiz') {
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="pb-32"
      >
        <button onClick={resetToList} className="flex items-center gap-2 text-sm mb-8 text-secondary hover:text-primary transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Abandonar sessão
        </button>

        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-end mb-4 px-1">
            <div className="flex items-center gap-4">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Praticando Tópico</p>
                  <h2 className="text-xl font-bold text-primary">{selectedTopic?.nome}</h2>
               </div>
               {currentQ && (
                 <div className="mb-0.5">
                   <FavoriteButton tipo="questao" referenciaId={currentQ.id} />
                 </div>
               )}
            </div>
            <div className="text-right">
                <span className="text-2xl font-black text-primary tracking-tighter">{currentIndex + 1}</span>
                <span className="text-sm font-bold text-muted ml-1">/ {questions.length}</span>
            </div>
          </div>
          <div className="progress-track h-2 mb-10 overflow-hidden shadow-sm">
            <motion.div 
              className="progress-fill h-2" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }} 
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Questão */}
          <motion.div variants={scaleIn} className="glass-card p-8 md:p-12 mb-8 bg-white/[0.015]">
             <p className="text-xl md:text-2xl font-bold leading-relaxed text-primary tracking-tight">
               {currentQ.enunciado}
             </p>
          </motion.div>

          {/* Opções */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4 mb-10 text-lg">
            {currentQ.opcoes.map((opt, index) => {
              const letra = opt.letra || String.fromCharCode(65 + index);
              const texto = opt.texto || opt;
              const isActive = selectedAnswer === letra;
              const isCorrect = isAnswered && letra === currentQ.resposta_correta;
              const isWrong = isAnswered && isActive && letra !== currentQ.resposta_correta;

              return (
                <motion.button
                  key={letra}
                  variants={staggerItem}
                  disabled={isAnswered}
                  onClick={() => setSelectedAnswer(letra)}
                  className={`
                    w-full text-left flex items-start gap-5 p-5 rounded-2xl border transition-all duration-300
                    ${isCorrect ? 'bg-success/10 border-success text-success shadow-[0_0_30px_rgba(var(--success-rgb),0.15)] glow-success' : ''}
                    ${isWrong ? 'bg-error/10 border-error text-error animate-wrongShake shadow-[0_0_30px_rgba(var(--error-rgb),0.15)] glow-error' : ''}
                    ${!isAnswered && isActive ? 'bg-accent/10 border-accent text-accent shadow-accent' : ''}
                    ${!isAnswered && !isActive ? 'bg-secondary border-default text-primary hover:bg-white/[0.04] hover:translate-x-2' : ''}
                    ${isAnswered && !isCorrect && !isWrong ? 'bg-transparent border-subtle text-muted opacity-40 grayscale' : ''}
                  `}
                >
                  <span className={`
                    w-8 h-8 shrink-0 flex items-center justify-center rounded-xl text-sm font-black transition-all
                    ${isCorrect ? 'bg-success text-white shadow-lg scale-110' : ''}
                    ${isWrong ? 'bg-error text-white shadow-lg scale-110' : ''}
                    ${isActive && !isAnswered ? 'bg-accent text-white shadow-lg scale-110' : ''}
                    ${!isActive && !isAnswered ? 'bg-white/[0.06] text-secondary' : ''}
                    ${isAnswered && !isActive && !isCorrect ? 'bg-white/[0.02] text-muted' : ''}
                  `}>
                    {letra}
                  </span>
                  <span className="pt-0.5 font-bold leading-relaxed">{texto}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Explicação */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                className="glass-card p-6 md:p-8 mb-10 border-accent/20 bg-accent/[0.02]"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 text-accent">
                    <PenTool className="w-5 h-5" /> Explicação do Professor
                  </h4>
                </div>
                <p className="text-base leading-relaxed text-secondary font-medium italic">"{currentQ.explicacao}"</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3 mt-12 pb-8">
             {isAnswered && (
                <button onClick={resetToList}
                  className="px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all text-muted hover:text-primary mr-auto"
                >
                  Sair
                </button>
             )}

            {!isAnswered ? (
              <button
                onClick={handleAnswer}
                disabled={!selectedAnswer}
                className={`
                  px-12 py-4 rounded-2xl text-base font-black uppercase tracking-widest transition-all
                  ${selectedAnswer
                    ? 'bg-gradient-accent text-white border border-white/20 shadow-glow-accent hover:opacity-90 active:scale-95'
                    : 'bg-secondary text-muted border border-default cursor-not-allowed'
                  }
                `}
              >
                Confirmar
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-12 py-4 rounded-2xl text-base font-black uppercase tracking-widest bg-accent-subtle text-accent border border-accent-border hover:bg-accent/20 transition-all flex items-center gap-3 shadow-lg"
              >
                {currentIndex < questions.length - 1 ? <>Próxima <ChevronRight className="w-5 h-5" /></> : 'Ver Resultado'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── RESULT ──
  if (view === 'result' && savedSession) {
    const { total, correct, scorePercent } = savedSession;
    const isSuccess = scorePercent >= 70;
    const isAverage = scorePercent >= 50 && scorePercent < 70;

    const scoreColorClass = isSuccess ? 'text-success' : isAverage ? 'text-warning' : 'text-error';
    const scoreBgClass = isSuccess ? 'bg-success/10 border-success/30' : isAverage ? 'bg-warning/10 border-warning/30' : 'bg-error/10 border-error/30';

    return (
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="pb-20 pt-10"
      >
        <div className="max-w-md mx-auto text-center">
          <motion.div 
            variants={scaleIn}
            className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 border-2 shadow-2xl ${scoreBgClass}`}
          >
            <Target className={`w-11 h-11 ${scoreColorClass}`} />
          </motion.div>
          
          <motion.h2 variants={staggerItem} className="text-3xl font-black text-primary tracking-tight mb-1">Sessão Concluída</motion.h2>
          <motion.p variants={staggerItem} className="text-sm font-bold mb-10 text-muted uppercase tracking-widest">{selectedTopic?.nome}</motion.p>

          <motion.div variants={scaleIn} className="glass-card p-10 mb-10 border-accent/10 shadow-glow-accent">
            <div className={`text-7xl font-black mb-3 italic tracking-tighter ${scoreColorClass}`}>
              {scorePercent}<span className="text-2xl text-muted font-black opacity-30">%</span>
            </div>
            <p className="text-base text-secondary font-bold">
              Você acertou {correct} de {total} questões
            </p>
          </motion.div>

          {sessionHistory.length > 1 && (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="text-left mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-4 text-muted opacity-60 px-1">
                Progresso na Matéria
              </p>
              <div className="space-y-3">
                {sessionHistory.map((s, i) => {
                  const sColorClass = s.score_percent >= 70 ? 'text-success' : s.score_percent >= 50 ? 'text-warning' : 'text-error';
                  return (
                    <motion.div key={i} variants={staggerItem} className={`glass-card flex items-center justify-between px-5 py-4 border-white/[0.03] ${i === 0 ? 'bg-accent/10 border-accent/20' : ''}`}>
                      <div className="flex items-center gap-4">
                        {i === 0 && <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-accent text-white uppercase tracking-tighter glow-accent">Atual</span>}
                        <span className="text-xs text-muted font-bold">
                          {new Date(s.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xs text-muted font-black opacity-40">{s.questions_correct}/{s.questions_total}</span>
                        <span className={`text-base font-black ${sColorClass}`}>{s.score_percent}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <motion.button
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startQuiz(selectedTopic)}
              className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-gradient-accent text-white shadow-glow-accent hover:opacity-90 transition-all flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-5 h-5" /> Refazer esta bateria
            </motion.button>
            <motion.button
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetToList}
              className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-accent-subtle text-accent border border-accent-border hover:bg-accent/20 transition-all flex items-center justify-center gap-3"
            >
              <ArrowLeft className="w-5 h-5" /> Estudar outro Tópico
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
