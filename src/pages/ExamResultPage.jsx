import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Target, Clock, ArrowLeft, Loader2, 
  ChevronDown, CheckCircle2, XCircle, RotateCcw,
  LayoutDashboard, BookOpen, Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { pageVariants, staggerContainer, staggerItem, scaleIn, expandDown } from '../lib/animations';
import FavoriteButton from '../components/ui/FavoriteButton';
import { updateUserStats } from '../lib/gamification';
import { checkAndUnlockAchievements } from '../lib/achievements';
import { useAuth } from '../hooks/useAuth';

export default function ExamResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openQ, setOpenQ] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: s, error: sE } = await supabase.from('exam_sessions').select('*, subjects(nome)').eq('id', id).single();
        if (sE) throw sE;
        setSession(s);

        const { data: qData, error: qE } = await supabase
          .from('questions')
          .select('id, enunciado, opcoes, resposta_correta, explicacao, topic_id(nome, subjects(nome, cor))')
          .in('id', s.questoes);
        if (qE) throw qE;
        
        // Manter ordem do simulado
        const ordered = s.questoes.map(qid => qData.find(q => q.id === qid));
        setQuestions(ordered);

        // ── ATUALIZAR GAMIFICAÇÃO ──
        if (s.status === 'finalizada' && s.questoes.length > 0) {
          const totalQ = s.questoes.length;
          const totalC = ordered.filter(q => s.respostas[q.id] === q.resposta_correta).length;
          
          const stats = await updateUserStats(supabase, user.id, { 
            questoes: totalQ, 
            acertos: totalC 
          });
          await checkAndUnlockAchievements(supabase, user.id, stats);
        }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, [id, user]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted">Calculando resultados...</p>
    </div>
  );

  if (error) return <div className="p-8 text-center text-error">Erro: {error}</div>;

  const total = questions.length;
  const correct = questions.filter(q => session.respostas[q.id] === q.resposta_correta).length;
  const score = Math.round((correct / total) * 100);
  const timeStr = session.tempo_gasto_segundos 
    ? `${Math.floor(session.tempo_gasto_segundos / 60)}min ${session.tempo_gasto_segundos % 60}s` 
    : 'N/A';

  // Agrupar por matéria
  const statsBySubject = {};
  questions.forEach(q => {
    const subName = q.topic_id?.subjects?.nome || 'Geral';
    if (!statsBySubject[subName]) statsBySubject[subName] = { total: 0, correct: 0, color: q.topic_id?.subjects?.cor };
    statsBySubject[subName].total++;
    if (session.respostas[q.id] === q.resposta_correta) statsBySubject[subName].correct++;
  });

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pb-24">
      <div className="max-w-4xl mx-auto">
        
        {/* Header de Resultado */}
        <div className="text-center mb-16">
          <motion.div 
            variants={scaleIn}
            className="w-24 h-24 rounded-[32px] bg-accent/10 flex items-center justify-center mx-auto mb-8 shadow-glow-accent border-2 border-accent/20"
          >
            <Trophy className="w-12 h-12 text-accent" />
          </motion.div>
          <motion.h1 variants={staggerItem} className="text-4xl font-black text-primary tracking-tighter mb-2 italic">Desempenho Final</motion.h1>
          <motion.p variants={staggerItem} className="text-sm font-bold text-muted uppercase tracking-[0.25em]">Simulado Simulado Banco do Brasil</motion.p>
        </div>

        {/* Stats Grid */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <motion.div variants={staggerItem} className="glass-card p-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-20 h-20 -mr-6 -mt-6" />
              </div>
              <div className={`text-7xl font-black mb-2 italic tracking-tighter ${score >= 70 ? 'text-success' : 'text-accent'}`}>{score}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">Aproveitamento Total</div>
           </motion.div>

           <motion.div variants={staggerItem} className="glass-card p-8 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3 text-secondary mb-1">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-sm font-bold">Acertos</span>
              </div>
              <div className="text-4xl font-black text-primary italic tracking-tight">{correct} / {total}</div>
           </motion.div>

           <motion.div variants={staggerItem} className="glass-card p-8 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3 text-secondary mb-1">
                <Clock className="w-5 h-5 text-warning" />
                <span className="text-sm font-bold">Tempo Gasto</span>
              </div>
              <div className="text-4xl font-black text-primary italic tracking-tight">{timeStr}</div>
           </motion.div>
        </motion.div>

        {/* Performance por Matéria */}
        <motion.section variants={staggerItem} className="glass-card p-8 mb-12">
           <h2 className="text-lg font-black text-primary uppercase tracking-widest mb-8 flex items-center gap-3">
             <BookOpen className="w-5 h-5 text-accent" /> Desempenho por Matéria
           </h2>
           <div className="space-y-6">
             {Object.entries(statsBySubject).map(([name, data]) => {
               const p = Math.round((data.correct / data.total) * 100);
               return (
                 <div key={name} className="space-y-2">
                   <div className="flex justify-between items-end">
                     <span className="text-sm font-bold text-primary">{name}</span>
                     <span className="text-xs font-mono font-bold text-muted">{data.correct}/{data.total} · <span className="text-primary">{p}%</span></span>
                   </div>
                   <div className="progress-track h-2">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${p}%` }} 
                        className="progress-fill h-2" 
                        style={{ background: data.color || 'var(--accent)' }} 
                     />
                   </div>
                 </div>
               );
             })}
           </div>
        </motion.section>

        {/* Gabarito Detalhado */}
        <motion.section variants={staggerItem} className="space-y-4">
           <h2 className="text-lg font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-3 px-1">
             <Target className="w-5 h-5 text-accent" /> Gabarito Detalhado
           </h2>
           
           {questions.map((q, i) => {
             const userAns = session.respostas[q.id];
             const isCorrect = userAns === q.resposta_correta;
             const isOpen = openQ === q.id;

             return (
               <div key={q.id} className="glass-card !p-0 overflow-hidden">
                 <button 
                   onClick={() => setOpenQ(isOpen ? null : q.id)}
                   className={`w-full flex items-center justify-between gap-4 p-6 text-left transition-all ${isCorrect ? 'bg-success/[0.02]' : 'bg-error/[0.02]'}`}
                 >
                   <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 font-black text-sm italic ${isCorrect ? 'border-success/30 text-success bg-success/10' : 'border-error/30 text-error bg-error/10'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-primary line-clamp-1">{q.enunciado}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">{q.topic_id?.subjects?.nome} · {q.topic_id?.nome}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      {isCorrect ? <CheckCircle2 className="w-5 h-5 text-success" /> : <XCircle className="w-5 h-5 text-error" />}
                      <ChevronDown className={`w-5 h-5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                   </div>
                 </button>

                 <AnimatePresence>
                   {isOpen && (
                     <motion.div variants={expandDown} initial="initial" animate="animate" exit="exit" className="p-8 border-t border-default bg-secondary/30">
                        <p className="text-lg font-bold text-primary mb-8 leading-relaxed italic">"{q.enunciado}"</p>
                        
                        <div className="grid grid-cols-1 gap-3 mb-8">
                          {q.opcoes.map(opt => {
                             const isCorrectOpt = opt.letra === q.resposta_correta;
                             const isUserOpt = opt.letra === userAns;
                             return (
                               <div key={opt.letra} className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                                 isCorrectOpt ? 'bg-success/10 border-success/40 text-primary' : 
                                 isUserOpt && !isCorrectOpt ? 'bg-error/10 border-error/40 text-primary' : 
                                 'bg-white/[0.02] border-transparent text-muted opacity-60'
                               }`}>
                                 <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-lg bg-black/20 text-xs font-black">{opt.letra}</span>
                                 <span className="font-bold text-sm tracking-tight">{opt.texto}</span>
                                 {isCorrectOpt && <CheckCircle2 className="w-4 h-4 ml-auto text-success" />}
                                 {isUserOpt && !isCorrectOpt && <XCircle className="w-4 h-4 ml-auto text-error" />}
                               </div>
                             );
                          })}
                        </div>

                        <div className="p-6 rounded-2xl bg-accent/[0.03] border border-accent/20">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-3 flex items-center gap-2">Explicação</h4>
                           <p className="text-sm text-secondary leading-relaxed font-medium italic">"{q.explicacao}"</p>
                        </div>

                        <div className="mt-6 flex justify-end">
                           <FavoriteButton tipo="questao" referenciaId={q.id} />
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             );
           })}
        </motion.section>

        {/* Ações Finais */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Link to="/modo-prova" className="flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-gradient-accent text-white shadow-glow-accent hover:opacity-90 active:scale-95 transition-all">
             <RotateCcw className="w-5 h-5" /> Novo Simulado
           </Link>
           <Link to="/dashboard" className="flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-secondary text-primary border border-default hover:bg-white/[0.03] active:scale-95 transition-all">
             <LayoutDashboard className="w-5 h-5" /> Voltar ao Início
           </Link>
        </div>

      </div>
    </motion.div>
  );
}
