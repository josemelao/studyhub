import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Loader2, CircleHelp,
  PenTool, Target, RotateCcw, ArrowLeft, Check
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function QuestoesPage() {
  const { user } = useAuth();
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
      try {
        setLoadingSubjects(true);
        const { data, error } = await supabase
          .from('subjects')
          .select('id, nome, cor, icone, categoria, ordem, sub_subjects(id, nome, ordem, topics(id, nome, ordem))')
          .order('ordem');
        if (error) throw error;
        setSubjects(data || []);
      } catch (err) { console.error(err); }
      finally { setLoadingSubjects(false); }
    }
    load();
  }, []);

  const startQuiz = async (topic) => {
    try {
      setLoadingQuiz(true);
      setSelectedTopic(topic);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setSessionAnswers([]);

      const { data: qData, error } = await supabase.from('questions').select('*').eq('topic_id', topic.id);
      if (error) throw error;
      if (!qData?.length) { alert('Nenhuma questão cadastrada para este tópico.'); setLoadingQuiz(false); return; }
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
    const answers = [...sessionAnswers, {
      questionId: questions[currentIndex].id,
      isCorrect: selectedAnswer === questions[currentIndex].resposta_correta
    }];
    const total = questions.length;
    const correct = answers.filter(a => a.isCorrect).length;
    const scorePercent = Math.round((correct / total) * 100);

    try {
      await supabase.from('quiz_sessions').insert({
        user_id: user.id, topic_id: selectedTopic.id,
        questions_total: total, questions_correct: correct, score_percent: scorePercent
      });
      const { data: hist } = await supabase
        .from('quiz_sessions').select('*')
        .eq('user_id', user.id).eq('topic_id', selectedTopic.id)
        .order('completed_at', { ascending: false }).limit(10);
      setSessionHistory(hist || []);
    } catch (err) { console.error(err); }

    setSavedSession({ total, correct, scorePercent });
    setView('result');
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
        <p className="text-sm text-text-muted">Carregando matérias...</p>
      </div>
    );

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20 space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent/10 text-accent">
              <CircleHelp className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Questões</h1>
          </div>
          <p className="text-sm mt-1 ml-12 text-text-muted">
            Selecione um tópico e inicie uma bateria de questões.
          </p>
        </section>

        <div className="space-y-3">
          {subjects.map(subject => {
            const Icon = Icons[subject.icone] || Icons.BookOpen;
            const isOpen = openSubject === subject.id;

            return (
              <div key={subject.id} className="glass-card overflow-hidden !p-0">
                <button
                  onClick={() => setOpenSubject(isOpen ? null : subject.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
                    isOpen ? 'bg-accent/5' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all"
                    style={{ background: `${subject.cor}15`, color: subject.cor }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`flex-1 font-semibold text-sm ${isOpen ? 'text-accent' : 'text-text-primary'}`}>
                    {subject.nome}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-text-muted ${isOpen ? 'rotate-180 text-accent' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border-default"
                    >
                      {(subject.sub_subjects || []).sort((a,b) => a.ordem - b.ordem).map(ss => (
                        <div key={ss.id}>
                          <div className="px-5 py-2 bg-white/[0.02]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                              {ss.nome}
                            </span>
                          </div>
                          {(ss.topics || []).sort((a,b) => a.ordem - b.ordem).map(topic => (
                            <div key={topic.id}
                              className="flex items-center justify-between px-5 py-3 border-t border-border-subtle hover:bg-white/[0.02] transition-colors group"
                            >
                              <span className="text-sm text-text-primary">{topic.nome}</span>
                              <button
                                onClick={() => startQuiz(topic)}
                                disabled={loadingQuiz}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-subtle text-accent border border-accent-border hover:bg-accent/20 transition-all"
                              >
                                {loadingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Iniciar <ChevronRight className="w-3 h-3 ml-0.5" /></>}
                              </button>
                            </div>
                          ))}
                          {(!ss.topics?.length) && (
                            <div className="px-5 py-3 text-xs text-text-muted border-t border-border-subtle">
                              Nenhum tópico cadastrado.
                            </div>
                          )}
                        </div>
                      ))}
                      {(!subject.sub_subjects?.length) && (
                        <div className="px-5 py-4 text-sm text-text-muted">Nenhuma submatéria cadastrada.</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ── QUIZ ──
  if (view === 'quiz') {
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
        <button onClick={resetToList} className="flex items-center gap-2 text-sm mb-6 text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Abandonar quiz
        </button>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center text-sm mb-2 text-text-muted">
            <span className="font-semibold text-text-primary">{selectedTopic?.nome}</span>
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>
          <div className="progress-track h-1.5 mb-8">
            <div className="progress-fill h-1.5" style={{ width: `${progress}%` }} />
          </div>

          {/* Questão */}
          <div className="glass-card p-6 md:p-8 mb-8">
             <p className="text-lg font-medium leading-relaxed text-text-primary">
               {currentQ.enunciado}
             </p>
          </div>

          {/* Opções */}
          <div className="space-y-3 mb-8">
            {currentQ.opcoes.map(opt => {
              const isActive = selectedAnswer === opt.letra;
              const isCorrect = isAnswered && opt.letra === currentQ.resposta_correta;
              const isWrong = isAnswered && isActive && opt.letra !== currentQ.resposta_correta;

              return (
                <button
                  key={opt.letra}
                  disabled={isAnswered}
                  onClick={() => setSelectedAnswer(opt.letra)}
                  className={`
                    w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all duration-200
                    ${isCorrect ? 'bg-success/10 border-success text-success shadow-[0_0_20px_rgba(52,211,153,0.1)]' : ''}
                    ${isWrong ? 'bg-error/10 border-error text-error animate-wrongShake' : ''}
                    ${!isAnswered && isActive ? 'bg-accent/10 border-accent text-accent shadow-accent' : ''}
                    ${!isAnswered && !isActive ? 'bg-bg-secondary border-border-default text-text-primary hover:bg-white/[0.04]' : ''}
                    ${isAnswered && !isCorrect && !isWrong ? 'bg-transparent border-border-subtle text-text-muted opacity-50' : ''}
                  `}
                >
                  <span className={`
                    w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-xs font-bold transition-colors
                    ${isActive || isCorrect ? 'bg-current text-white' : 'bg-white/[0.06] text-text-secondary'}
                  `} style={isActive || isCorrect ? { color: 'white' } : {}}>
                    {opt.letra}
                  </span>
                  <span className="pt-0.5 text-sm leading-relaxed">{opt.texto}</span>
                </button>
              );
            })}
          </div>

          {/* Explicação */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mb-8 border-accent/20">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-accent">
                  <PenTool className="w-4 h-4" /> Explicação
                </h4>
                <p className="text-sm leading-relaxed text-text-secondary">{currentQ.explicacao}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3">
             {isAnswered && (
                <button onClick={resetToList}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all text-text-muted hover:text-text-primary mr-auto"
                >
                  Finalizar
                </button>
             )}

            {!isAnswered ? (
              <button
                onClick={handleAnswer}
                disabled={!selectedAnswer}
                className={`
                  px-8 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${selectedAnswer
                    ? 'bg-gradient-accent text-white shadow-glow-accent hover:opacity-90 active:scale-95'
                    : 'bg-bg-secondary text-text-muted border border-border-default cursor-not-allowed'
                  }
                `}
              >
                Confirmar Resposta
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-2.5 rounded-xl text-sm font-bold bg-accent-subtle text-accent border border-accent-border hover:bg-accent/20 transition-all flex items-center gap-2"
              >
                {currentIndex < questions.length - 1 ? <>Próxima Questão <ChevronRight className="w-4 h-4" /></> : 'Ver Resultado Final'}
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
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="pb-20">
        <div className="max-w-md mx-auto text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 ${scoreBgClass}`}>
            <Target className={`w-9 h-9 ${scoreColorClass}`} />
          </div>
          <h2 className="text-2xl font-bold mb-1 text-text-primary">Sessão Concluída</h2>
          <p className="text-sm mb-8 text-text-muted">{selectedTopic?.nome}</p>

          <div className="glass-card p-8 mb-8 border-accent/10">
            <div className={`text-6xl font-bold mb-2 ${scoreColorClass}`}>
              {scorePercent}<span className="text-2xl text-text-muted font-medium">%</span>
            </div>
            <p className="text-sm text-text-secondary font-medium">
              Você acertou {correct} de {total} questões
            </p>
          </div>

          {sessionHistory.length > 1 && (
            <div className="text-left mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3 text-text-muted opacity-70">
                Histórico de tentativas
              </p>
              <div className="space-y-2">
                {sessionHistory.map((s, i) => {
                  const sColorClass = s.score_percent >= 70 ? 'text-success' : s.score_percent >= 50 ? 'text-warning' : 'text-error';
                  return (
                    <div key={i} className={`glass-card flex items-center justify-between px-4 py-3 border border-white/[0.03] ${i === 0 ? 'bg-accent/10 border-accent/20' : ''}`}>
                      <div className="flex items-center gap-3">
                        {i === 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent text-white uppercase tracking-tight">Atual</span>}
                        <span className="text-xs text-text-muted font-medium">
                          {new Date(s.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] text-text-muted font-medium">{s.questions_correct}/{s.questions_total}</span>
                        <span className={`text-sm font-bold ${sColorClass}`}>{s.score_percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => startQuiz(selectedTopic)}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-accent text-white shadow-glow-accent hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Refazer este Quiz
            </button>
            <button
              onClick={resetToList}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-accent-subtle text-accent border border-accent-border hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Estudar outro Tópico
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
