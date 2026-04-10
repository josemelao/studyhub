import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Settings2, BookOpen, Clock, 
  Target, ChevronRight, Loader2, Play 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { pageVariants, staggerContainer, staggerItem, scaleIn } from '../lib/animations';

export default function ExamConfigPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form states
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [numQuestions, setNumQuestions] = useState(20);
  const [timeLimit, setTimeLimit] = useState(60); // minutos

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('subjects').select('id, nome, icone, cor').order('ordem');
        setSubjects(data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const toggleSubject = (id) => {
    setSelectedSubjects(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startExam = async () => {
    if (selectedSubjects.length === 0) {
      alert('Selecione pelo menos uma matéria para o simulado.');
      return;
    }

    try {
      setCreating(true);
      
      // 1. Buscar questões das matérias selecionadas
      const { data: questionsData, error: qError } = await supabase
        .from('questions')
        .select('id, topic_id(subject_id)')
        .filter('topic_id.subject_id', 'in', `(${selectedSubjects.join(',')})`)
        .limit(numQuestions * 2); // pegar um pouco mais para garantir diversidade

      if (qError) throw qError;
      if (!questionsData?.length) {
        alert('Nenhuma questão encontrada para as matérias selecionadas.');
        return;
      }

      // 2. Embaralhar e limitar
      const shuffledIds = questionsData
        .sort(() => Math.random() - 0.5)
        .slice(0, numQuestions)
        .map(q => q.id);

      // 3. Criar sessão no banco
      const { data: session, error: sError } = await supabase
        .from('exam_sessions')
        .insert({
          user_id: user.id,
          configuracao: { 
            subjects: selectedSubjects, 
            total_questoes: shuffledIds.length, 
            tempo_minutos: timeLimit 
          },
          questoes: shuffledIds,
          status: 'em_andamento'
        })
        .select()
        .single();

      if (sError) throw sError;
      
      navigate(`/modo-prova/sessao/${session.id}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar simulado. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted">Preparando simulador...</p>
    </div>
  );

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pb-20 space-y-10"
    >
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
            <Trophy className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Modo Prova</h1>
        </div>
        <p className="text-sm text-muted ml-14">
          Configure seu simulado personalizado e teste sua velocidade e precisão.
        </p>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configurações principais */}
        <div className="lg:col-span-2 space-y-8">
          <motion.section variants={scaleIn} className="glass-card p-8 bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-primary">1. Selecione as Matérias</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => toggleSubject(sub.id)}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl border transition-all text-left
                    ${selectedSubjects.includes(sub.id) 
                      ? 'bg-accent/10 border-accent/50 text-primary shadow-glow-accent' 
                      : 'bg-secondary border-subtle text-secondary hover:border-hover'
                    }
                  `}
                >
                  <div 
                    className="w-4 h-4 rounded border flex items-center justify-center transition-all"
                    style={selectedSubjects.includes(sub.id) ? { background: sub.cor, borderColor: sub.cor } : {}}
                  >
                    {selectedSubjects.includes(sub.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className="font-bold text-sm truncate">{sub.nome}</span>
                </button>
              ))}
            </div>
          </motion.section>

          <motion.section variants={scaleIn} className="glass-card p-8 bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-8">
              <Target className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-primary">2. Quantidade de Questões</h2>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-5xl font-black text-accent">{numQuestions}</span>
                <span className="text-sm font-bold text-muted uppercase tracking-widest pb-1">questões</span>
              </div>
              <input 
                type="range" min="5" max="100" step="5"
                value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))}
                className="w-full accent-accent bg-tertiary h-2 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-black uppercase text-muted px-1 tracking-widest">
                <span>Min: 5</span>
                <span>Max: 100</span>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Resumo e Tempo */}
        <div className="space-y-8">
          <motion.section variants={scaleIn} className="glass-card p-8 border-accent/20 bg-accent/[0.02]">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-primary">Tempo de Prova</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[30, 60, 120, 240].map(m => (
                <button
                  key={m}
                  onClick={() => setTimeLimit(m)}
                  className={`
                    py-3 rounded-xl border font-bold text-sm transition-all
                    ${timeLimit === m 
                      ? 'bg-accent text-white border-accent shadow-glow-accent' 
                      : 'bg-tertiary border-subtle text-secondary hover:border-accent/40'
                    }
                  `}
                >
                  {m >= 60 ? `${m/60}h` : `${m}min`}
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-6 border-t border-default mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Matérias</span>
                <span className="font-bold text-primary">{selectedSubjects.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Total de Questões</span>
                <span className="font-bold text-primary">{numQuestions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Tempo Médio</span>
                <span className="font-bold text-primary">{(timeLimit / numQuestions).toFixed(1)} min/q</span>
              </div>
            </div>

            <button
              onClick={startExam}
              disabled={creating || loading}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-gradient-accent text-white shadow-glow-accent hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {creating ? 'Iniciando...' : 'Começar Prova'}
            </button>
          </motion.section>

          <motion.div variants={staggerItem} className="p-6 rounded-2xl bg-secondary border border-subtle text-center">
            <Settings2 className="w-5 h-5 text-muted mx-auto mb-3" />
            <p className="text-xs text-muted font-medium italic">
              "No Modo Prova, você não verá as respostas certas até finalizar a sessão inteira."
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
