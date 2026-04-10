import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle, ChevronLeft, ChevronRight, 
  Loader2, AlertCircle, LayoutGrid, Flag
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { pageVariants, scaleIn, staggerItem } from '../lib/animations';

export default function ExamSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showMap, setShowMap] = useState(false);

  // 1. Carregar dados
  useEffect(() => {
    async function load() {
      try {
        const { data: s, error: sE } = await supabase.from('exam_sessions').select('*').eq('id', id).single();
        if (sE) throw sE;
        if (s.status !== 'em_andamento') { navigate(`/modo-prova/resultado/${id}`); return; }
        
        setSession(s);
        setAnswers(s.respostas || {});
        
        // Calcular tempo restante
        const start = new Date(s.iniciada_em).getTime();
        const limitMs = s.configuracao.tempo_minutos * 60 * 1000;
        const elapsed = Date.now() - start;
        setTimeLeft(Math.max(0, Math.floor((limitMs - elapsed) / 1000)));

        // Buscar detalhes das questões
        const { data: qData, error: qE } = await supabase
          .from('questions')
          .select('id, enunciado, opcoes, explicacao')
          .in('id', s.questoes);
        if (qE) throw qE;
        
        // Manter a ordem especificada na sessão
        const ordered = s.questoes.map(qid => qData.find(q => q.id === qid));
        setQuestions(ordered);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [id, navigate]);

  // 2. Timer
  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(interval); finishExam(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, timeLeft]);

  // 3. Prevenir saída acidental
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Deseja realmente sair? Sua prova não será salva.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 4. Salvar resposta (Otimista)
  const saveAnswer = async (qId, letra) => {
    const newAnswers = { ...answers, [qId]: letra };
    setAnswers(newAnswers);
    // Silent update no background
    await supabase.from('exam_sessions').update({ respostas: newAnswers }).eq('id', id);
  };

  // 5. Finalizar
  const finishExam = useCallback(async () => {
    try {
      setSubmitting(true);
      const { error } = await supabase.from('exam_sessions').update({
        status: 'finalizada',
        finalizada_em: new Date().toISOString(),
        tempo_gasto_segundos: session.configuracao.tempo_minutos * 60 - timeLeft
      }).eq('id', id);
      if (error) throw error;
      navigate(`/modo-prova/resultado/${id}`);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  }, [id, timeLeft, session, navigate]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted">Iniciando simulado...</p>
    </div>
  );

  const currentQ = questions[currentIndex];
  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="pb-32 relative">
      {/* Header Fixo de Simulado */}
      <div className="sticky top-0 z-40 bg-primary/80 backdrop-blur-xl border-b border-default pt-2 pb-4 -mx-4 px-4 sm:-mx-8 sm:px-8 mb-8">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black mono ${timeLeft < 300 ? 'bg-error/10 text-error animate-pulse' : 'bg-accent/10 text-accent'}`}>
              <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
            </div>
            <div className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-muted">
              Simulado StudyHub
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setShowMap(!showMap)}
              className={`p-2.5 rounded-xl border transition-all ${showMap ? 'bg-accent text-white border-accent' : 'bg-secondary border-default text-muted hover:text-primary'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
               onClick={() => { if(window.confirm('Deseja finalizar a prova agora?')) finishExam(); }}
               disabled={submitting}
               className="flex items-center gap-2 px-5 py-2.5 bg-gradient-accent text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-glow-accent hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span className="hidden sm:inline">Finalizar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Mapa de Questões (Overlay) */}
        <AnimatePresence>
          {showMap && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="glass-card p-6 mb-8 border-accent/30 bg-accent/[0.03] shadow-glow-accent"
            >
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-accent">
                <LayoutGrid className="w-4 h-4" /> Mapa de Questões
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIndex(i); setShowMap(false); }}
                    className={`
                      aspect-square rounded-lg text-xs font-black flex items-center justify-center transition-all border
                      ${currentIndex === i ? 'ring-2 ring-accent ring-offset-4 ring-offset-bg-primary' : ''}
                      ${answers[q.id] ? 'bg-accent text-white border-accent shadow-accent' : 'bg-tertiary border-subtle text-muted hover:border-accent/40'}
                    `}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questão Atual */}
        <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
           <div className="flex items-center gap-3 mb-4 px-1">
              <span className="px-3 py-1 rounded-full bg-accent text-[10px] text-white font-black uppercase tracking-tighter">
                Questão {currentIndex + 1}
              </span>
              <div className="h-px flex-1 bg-border-subtle opacity-30" />
           </div>

           <div className="glass-card p-8 md:p-12 mb-8 bg-white/[0.015]">
             <p className="text-xl md:text-2xl font-bold leading-relaxed text-primary tracking-tight">
               {currentQ.enunciado}
             </p>
           </div>

           {/* Opções */}
           <div className="space-y-4 mb-16">
            {currentQ.opcoes.map(opt => {
              const isActive = answers[currentQ.id] === opt.letra;
              return (
                <button
                  key={opt.letra}
                  onClick={() => saveAnswer(currentQ.id, opt.letra)}
                  className={`
                    w-full text-left flex items-start gap-5 p-5 rounded-2xl border transition-all duration-300
                    ${isActive ? 'bg-accent/10 border-accent text-primary shadow-glow-accent' : 'bg-secondary border-default text-muted hover:bg-white/[0.04]'}
                  `}
                >
                  <span className={`
                    w-8 h-8 shrink-0 flex items-center justify-center rounded-xl text-sm font-black transition-all
                    ${isActive ? 'bg-accent text-white scale-110 shadow-lg' : 'bg-white/[0.06] text-secondary'}
                  `}>
                    {opt.letra}
                  </span>
                  <span className="pt-0.5 font-bold leading-relaxed">{opt.texto}</span>
                </button>
              );
            })}
           </div>
        </motion.div>
      </div>

      {/* Navegação Inferior */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
        <div className="glass-card !p-2 flex items-center justify-between shadow-2xl bg-primary/90 backdrop-blur-md">
           <button
             onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
             disabled={currentIndex === 0}
             className="p-3 rounded-xl hover:bg-white/[0.05] text-muted disabled:opacity-20"
           >
             <ChevronLeft className="w-6 h-6" />
           </button>
           
           <div className="flex-1 text-center">
             <span className="text-sm font-black text-primary tracking-widest">{currentIndex + 1} <span className="text-muted opacity-40">/ {questions.length}</span></span>
           </div>

           {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(i => i + 1)}
                className="p-3 rounded-xl bg-accent-subtle text-accent hover:bg-accent/20 transition-all shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
           ) : (
              <button
                onClick={() => { if(window.confirm('Última questão. Deseja finalizar?')) finishExam(); }}
                className="px-6 py-3 rounded-xl bg-gradient-accent text-white text-xs font-black uppercase tracking-widest shadow-glow-accent"
              >
                Finalizar
              </button>
           )}
        </div>
      </div>
    </motion.div>
  );
}
