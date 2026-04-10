import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PlayCircle, Circle, CheckCircle2, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

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
      <p className="text-sm text-text-muted">Carregando matéria...</p>
    </div>
  );

  if (error || !subject) return (
    <div className="p-8 text-center text-error">Erro: {error || 'Matéria não encontrada'}</div>
  );

  const Icon = Icons[subject.icone] || Icons.BookOpen;
  const toggle = id => setOpenAccordion(p => ({ ...p, [id]: !p[id] }));

  const StatusIcon = ({ status }) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />;
    if (status === 'in-progress') return <PlayCircle className="w-4 h-4 shrink-0 text-warning" />;
    return <Circle className="w-4 h-4 shrink-0 text-text-muted" />;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
      <button
        onClick={() => navigate('/materias')}
        className="flex items-center gap-2 text-sm mb-8 text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para Matérias
      </button>

      {/* Header */}
      <div className="flex items-start gap-5 mb-10">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${subject.cor}20`, color: subject.cor, border: `1px solid ${subject.cor}35` }}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-text-muted">
            {subject.categoria}
          </p>
          <h1 className="text-2xl font-bold text-text-primary">{subject.nome}</h1>
        </div>
      </div>

      {/* Acordeão */}
      <div className="space-y-3">
        {subSubjects.length === 0 && (
          <div className="glass-card p-10 text-center text-text-muted">Nenhuma submatéria cadastrada.</div>
        )}

        {subSubjects.map(ss => {
          const isOpen = !!openAccordion[ss.id];
          const done = ss.topics.filter(t => t.status === 'completed').length;

          return (
            <div key={ss.id} className="glass-card overflow-hidden !p-0">
              <button
                onClick={() => toggle(ss.id)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                  isOpen ? 'bg-accent-subtle' : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : 'text-text-muted'}`} />
                  <span className={`font-semibold ${isOpen ? 'text-accent' : 'text-text-primary'}`}>{ss.nome}</span>
                </div>
                <span className="text-xs text-text-muted">{done}/{ss.topics.length}</span>
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
                    {ss.topics.length === 0 && (
                      <p className="px-5 py-4 text-sm text-text-muted">Nenhum tópico cadastrado.</p>
                    )}
                    {ss.topics.map(topic => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-border-subtle hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <StatusIcon status={topic.status} />
                          <div>
                            <div className="text-sm font-medium text-text-primary">{topic.nome}</div>
                            {topic.descricao && <div className="text-xs mt-0.5 text-text-muted">{topic.descricao}</div>}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/estudo/${topic.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-subtle text-accent border border-accent-border hover:bg-accent/20 transition-colors shrink-0"
                        >
                          Estudar <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
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
