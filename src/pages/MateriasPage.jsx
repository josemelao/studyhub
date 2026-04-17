import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, BookOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubjectsContext } from '../contexts/SubjectsContext';
import { pageVariants, staggerContainer, staggerItem } from '../lib/animations';

export default function MateriasPage() {
  const { subjects, loading, fetchSubjects } = useSubjectsContext();

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div 
          key="materias-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-40 gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted">Carregando catálogo de matérias...</p>
        </motion.div>
      ) : (
        <motion.div 
          key="materias-page-content"
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {subjects.map(sub => {
          const Icon = Icons[sub.icone] || Icons.BookOpen;
          const percent = sub.topicsTotal > 0 ? Math.round((sub.topicsDone / sub.topicsTotal) * 100) : 0;

          return (
            <Link to={`/materia/${sub.id}`} key={sub.id}>
              <motion.div
                variants={staggerItem}
                className="glass-card card-interactive p-5 group flex flex-col h-full border-white/5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110"
                    style={{ background: `${sub.cor}15`, color: sub.cor, border: `1px solid ${sub.cor}30` }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-0.5">{sub.categoria}</p>
                    <h3 className="font-bold text-sm text-primary group-hover:text-accent transition-colors truncate leading-tight">
                      {sub.nome}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-muted/30 group-hover:text-accent group-hover:translate-x-1 transition-all mt-1" />
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between text-[10px] mb-2 text-muted font-bold uppercase tracking-tight">
                    <span>{sub.topicsDone}/{sub.topicsTotal} módulos</span>
                    <span style={{ color: sub.cor }}>{percent}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ background: sub.cor, boxShadow: `0 0 10px ${sub.cor}40` }} 
                    />
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}

        {subjects.length === 0 && (
          <motion.div variants={staggerItem} className="col-span-full glass-card p-12 text-center text-muted border-dashed border-2">
            Nenhuma matéria cadastrada ainda.
          </motion.div>
        )}
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
