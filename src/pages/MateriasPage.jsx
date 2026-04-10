import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, BookOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubjectsContext } from '../contexts/SubjectsContext';
import { pageVariants, staggerContainer, staggerItem } from '../lib/animations';

export default function MateriasPage() {
  const { subjects, loading, fetchSubjects } = useSubjectsContext();

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  if (loading) return (
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
        {/* Header com ícone animável */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Matérias</h1>
        </div>
        <p className="text-sm text-muted ml-14">
          Selecione uma matéria para acessar os conteúdos e módulos de estudo.
        </p>
      </motion.section>

      <motion.div 
        variants={staggerContainer}
        initial="initial" 
        animate="animate" 
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {subjects.map(sub => {
          const Icon = Icons[sub.icone] || Icons.BookOpen;
          const percent = sub.topicsTotal > 0 ? Math.round((sub.topicsDone / sub.topicsTotal) * 100) : 0;

          return (
            <Link to={`/materia/${sub.id}`} key={sub.id}>
              <motion.div
                variants={staggerItem}
                className="glass-card card-interactive p-6 group"
              >
                <div className="flex items-center gap-4 mb-6">
                  {/* Cor dinâmica do banco */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: `${sub.cor}20`, color: sub.cor, border: `1px solid ${sub.cor}35` }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-primary group-hover:text-accent transition-colors truncate">
                      {sub.nome}
                    </h3>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">{sub.categoria}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2 text-muted font-medium">
                    <span>{sub.topicsDone} de {sub.topicsTotal} módulos lidos</span>
                    <span style={{ color: sub.cor }} className="font-bold">{percent}%</span>
                  </div>
                  <div className="progress-track h-2">
                    <motion.div 
                      className="progress-fill h-2" 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, delay: 0.1 }}
                      style={{ background: sub.cor }} 
                    />
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}

        {subjects.length === 0 && (
          <motion.div variants={staggerItem} className="col-span-2 glass-card p-12 text-center text-muted">
            Nenhuma matéria cadastrada ainda.
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
