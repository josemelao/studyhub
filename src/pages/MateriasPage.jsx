import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, BookOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubjectsContext } from '../contexts/SubjectsContext';

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

export default function MateriasPage() {
  const { subjects, loading, fetchSubjects } = useSubjectsContext();

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  if (loading) return (
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
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Matérias</h1>
        </div>
        <p className="text-sm mt-1 ml-12 text-text-muted">
          Selecione uma matéria para ver os conteúdos e módulos de estudo.
        </p>
      </section>

      <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subjects.map(sub => {
          const Icon = Icons[sub.icone] || Icons.BookOpen;
          const percent = sub.topicsTotal > 0 ? Math.round((sub.topicsDone / sub.topicsTotal) * 100) : 0;

          return (
            <Link to={`/materia/${sub.id}`} key={sub.id}>
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -3 }}
                className="glass-card p-5 cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-5">
                  {/* Cor dinâmica do banco */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${sub.cor}20`, color: sub.cor, border: `1px solid ${sub.cor}35` }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-text-primary group-hover:text-accent transition-colors truncate">
                      {sub.nome}
                    </h3>
                    <p className="text-xs mt-0.5 text-text-muted">{sub.categoria}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-text-muted group-hover:text-accent transition-colors" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 text-text-muted">
                    <span>{sub.topicsDone} de {sub.topicsTotal} módulos lidos</span>
                    <span style={{ color: sub.cor }} className="font-semibold">{percent}%</span>
                  </div>
                  <div className="progress-track h-1.5">
                    <div className="progress-fill h-1.5" style={{ width: `${percent}%`, background: sub.cor }} />
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}

        {subjects.length === 0 && (
          <div className="col-span-2 glass-card p-10 text-center text-text-muted">
            Nenhuma matéria cadastrada ainda.
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
