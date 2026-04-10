import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PlayCircle, Circle, CheckCircle2, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { pageVariants, staggerItem, staggerContainer, expandDown } from '../lib/animations';

export default function SubjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subject, setSubject] = useState(null);
  const [subSubjects, setSubSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAccordion, setOpenAccordion] = useState({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: subData, error: subE } = await supabase
          .from('subjects').select('*').eq('id', id).single();
        if (subE) throw subE;
        setSubject(subData);

        const { data: subSubs, error: ssE } = await supabase
          .from('sub_subjects')
          .select('id, nome, descricao, ordem, topics(id, nome, descricao, ordem)')
          .eq('subject_id', id).order('ordem');
        if (ssE) throw ssE;

        const { data: progData } = await supabase
          .from('user_progress')
          .select('topic_id, conteudo_lido')
          .eq('user_id', user.id);

        const enriched = (subSubs || []).map(ss => ({
          ...ss,
          topics: (ss.topics || []).sort((a, b) => a.ordem - b.ordem).map(topic => {
            const p = (progData || []).find(pr => pr.topic_id === topic.id);
            const status = !p ? 'not-started' : (p.conteudo_lido ? 'completed' : 'in-progress');
            return { ...topic, status };
          })
        }));

        setSubSubjects(enriched);
        if (enriched.length > 0) setOpenAccordion({ [enriched[0].id]: true });
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, [id, user]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted">Carregando matéria...</p>
    </div>
  );

  if (error || !subject) return (
    <div className="p-8 text-center text-error">Erro: {error || 'Matéria não encontrada'}</div>
  );

  const Icon = Icons[subject.icone] || Icons.BookOpen;
  const toggle = id => setOpenAccordion(p => ({ ...p, [id]: !p[id] }));

  const StatusIcon = ({ status }) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 shrink-0 text-success" />;
    if (status === 'in-progress') return <PlayCircle className="w-5 h-5 shrink-0 text-warning" />;
    return <Circle className="w-5 h-5 shrink-0 text-muted" />;
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pb-20"
    >
      <motion.button
        variants={staggerItem}
        onClick={() => navigate('/materias')}
        className="flex items-center gap-2 text-sm mb-8 text-secondary hover:text-primary transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar para Matérias
      </motion.button>

      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-start gap-6 mb-12">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg glow-accent"
          style={{ background: `${subject.cor}20`, color: subject.cor, border: `1px solid ${subject.cor}35` }}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1.5 text-muted">
            {subject.categoria}
          </p>
          <h1 className="text-4xl font-bold text-primary tracking-tight">{subject.nome}</h1>
        </div>
      </motion.div>

      {/* Acordeão */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {subSubjects.length === 0 && (
          <motion.div variants={staggerItem} className="glass-card p-12 text-center text-muted">
            Nenhuma submatéria cadastrada.
          </motion.div>
        )}

        {subSubjects.map(ss => {
          const isOpen = !!openAccordion[ss.id];
          const done = ss.topics.filter(t => t.status === 'completed').length;

          return (
            <motion.div key={ss.id} variants={staggerItem} className="glass-card overflow-hidden !p-0">
              <button
                onClick={() => toggle(ss.id)}
                className={`w-full flex items-center justify-between px-6 py-5 text-left transition-all duration-300 ${
                  isOpen ? 'bg-accent/5' : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-1 rounded-lg transition-transform duration-300 ${isOpen ? 'rotate-180 bg-accent/20 text-accent' : 'text-muted'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                  <span className={`font-bold text-lg ${isOpen ? 'text-accent' : 'text-primary'}`}>
                    {ss.nome}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="hidden sm:block w-24 h-1.5 progress-track">
                      <div className="progress-fill h-1.5" style={{ width: `${(done/(ss.topics.length||1))*100}%`, background: subject.cor }} />
                   </div>
                   <span className="text-xs font-bold font-mono text-muted">{done}/{ss.topics.length}</span>
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
                    {ss.topics.length === 0 && (
                      <p className="px-14 py-6 text-sm text-muted">Nenhum tópico cadastrado.</p>
                    )}
                    {ss.topics.map(topic => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between gap-4 px-6 md:px-14 py-4 border-t border-subtle hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="flex items-start gap-4">
                          <StatusIcon status={topic.status} />
                          <div>
                            <div className="text-base font-bold text-primary group-hover:text-accent transition-colors">{topic.nome}</div>
                            {topic.descricao && <div className="text-xs mt-1 text-muted line-clamp-1">{topic.descricao}</div>}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/estudo/${topic.id}`)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-accent-subtle text-accent border border-accent-border hover:bg-accent/20 transition-all shrink-0 shadow-sm"
                        >
                          Ir para Módulo <ChevronRight className="w-4 h-4" />
                        </button>
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
