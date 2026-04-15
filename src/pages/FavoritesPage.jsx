import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, BookOpen, CircleHelp, ChevronRight, Loader2, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { pageVariants, staggerContainer, staggerItem, expandDown } from '../lib/animations';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [favs, setFavs] = useState({ conteudo: [], questao: [] });
  const [openQ, setOpenQ] = useState(null);
  const [showGabarito, setShowGabarito] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { tipo, id }
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user || !currentWorkspaceId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId);
        
        if (error) throw error;

        const contIds = data.filter(f => f.tipo === 'conteudo').map(f => f.referencia_id);
        const quesIds = data.filter(f => f.tipo === 'questao').map(f => f.referencia_id);

        let contData = [];
        if (contIds.length > 0) {
          const { data: d } = await supabase
            .from('topics')
            .select('id, nome, subjects(nome, cor)')
            .in('id', contIds);
          contData = d || [];
        }

        let quesData = [];
        if (quesIds.length > 0) {
          const { data: d } = await supabase
            .from('questions')
            .select('id, enunciado, opcoes, resposta_correta, explicacao, topic_id(nome, subjects(nome, cor))')
            .in('id', quesIds);
          quesData = d || [];
        }

        setFavs({ conteudo: contData, questao: quesData });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, currentWorkspaceId]);

  const removeFav = async () => {
    if (!itemToDelete) return;
    const { tipo, id } = itemToDelete;
    
    try {
      setIsDeleting(true);
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .eq('tipo', tipo)
        .eq('referencia_id', id);
      setFavs(prev => ({
        ...prev,
        [tipo]: prev[tipo].filter(f => f.id !== id)
      }));
      setItemToDelete(null);
    } catch (err) { console.error(err); }
    finally { setIsDeleting(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted">Carregando seus favoritos...</p>
    </div>
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pb-20 space-y-12">
      <motion.section variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
              <Star className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-primary tracking-tighter italic">Favoritos</h1>
          </div>
          <p className="text-sm text-muted ml-16 font-medium">
            Toda sua curadoria de estudos organizada em uma única visão.
          </p>
        </div>
      </motion.section>

      {/* Grid Principal de 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* Coluna 1: Conteúdos */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
             <BookOpen className="w-5 h-5 text-accent" />
             <h2 className="text-xl font-black text-primary tracking-tight uppercase tracking-widest text-sm">Conteúdos Salvos</h2>
             <div className="h-px flex-1 bg-white/5 ml-2" />
             <span className="text-[10px] font-black text-muted bg-white/5 px-2 py-1 rounded-md">{favs.conteudo.length}</span>
          </div>

          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
             {favs.conteudo.length === 0 ? (
               <div className="glass-card p-12 text-center text-muted border-dashed border-white/5">Nenhum conteúdo favorito.</div>
             ) : (
               favs.conteudo.map(c => (
                 <motion.div key={c.id} variants={staggerItem} className="glass-card flex items-center justify-between p-5 group border-white/5">
                   <div className="flex items-center gap-4 flex-1 min-w-0">
                     <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                       <BookOpen className="w-5 h-5" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h3 className="font-bold text-primary group-hover:text-accent transition-colors truncate">{c.nome}</h3>
                       <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{c.subjects?.nome}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setItemToDelete({ tipo: 'conteudo', id: c.id })} className="p-2 text-muted hover:text-error transition-colors">
                         <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => navigate(`/estudo/${c.id}`)} className="p-2 bg-accent/10 text-accent rounded-xl hover:bg-accent hover:text-white transition-all">
                         <ArrowRight className="w-4 h-4" />
                      </button>
                   </div>
                 </motion.div>
               ))
             )}
          </motion.div>
        </div>

        {/* Coluna 2: Questões */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
             <CircleHelp className="w-5 h-5 text-orange-500" />
             <h2 className="text-xl font-black text-primary tracking-tight uppercase tracking-widest text-sm">Questões para Revisar</h2>
             <div className="h-px flex-1 bg-white/5 ml-2" />
             <span className="text-[10px] font-black text-muted bg-white/5 px-2 py-1 rounded-md">{favs.questao.length}</span>
          </div>

          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
             {favs.questao.length === 0 ? (
               <div className="glass-card p-12 text-center text-muted border-dashed border-white/5">Nenhuma questão favorita.</div>
             ) : (
               favs.questao.map(q => {
                 const isOpen = openQ === q.id;
                 return (
                   <motion.div key={q.id} variants={staggerItem} className="glass-card !p-0 overflow-hidden border-white/5">
                     <div className="p-4 flex items-center justify-between gap-4">
                       <div className="flex items-center gap-4 flex-1 min-w-0">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-orange-500 text-white shadow-glow-orange' : 'bg-orange-500/10 text-orange-500'}`}>
                           <CircleHelp className="w-5 h-5" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-primary truncate">{q.enunciado}</h3>
                            <p className="text-[9px] text-muted font-bold uppercase tracking-widest truncate">{q.topic_id?.subjects?.nome} · {q.topic_id?.nome}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setItemToDelete({ tipo: 'questao', id: q.id })} className="p-2 text-muted hover:text-error transition-colors">
                             <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (isOpen) {
                                setOpenQ(null);
                                setShowGabarito(false);
                              } else {
                                setOpenQ(q.id);
                                setShowGabarito(false);
                              }
                            }} 
                            className={`p-2 rounded-lg transition-all ${isOpen ? 'bg-orange-500/10 text-orange-500' : 'text-muted hover:bg-white/5'}`}
                          >
                             <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          </button>
                       </div>
                     </div>

                     <AnimatePresence>
                       {isOpen && (
                         <motion.div variants={expandDown} initial="initial" animate="animate" exit="exit" className="p-6 border-t border-default bg-secondary/30 space-y-6">
                            <div className="space-y-4">
                               <p className="text-sm font-bold text-primary italic leading-relaxed">"{q.enunciado}"</p>
                               
                               <div className="grid grid-cols-1 gap-2 mt-4">
                                  {q.opcoes?.map((opt, index) => {
                                     const letra = opt.letra || String.fromCharCode(65 + index);
                                     const texto = opt.texto || opt;
                                     return (
                                       <div key={letra} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                          <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-lg bg-white/[0.06] text-secondary text-[10px] font-black">{letra}</span>
                                          <span className="pt-0.5 text-xs font-medium text-primary/80">{texto}</span>
                                       </div>
                                     );
                                  })}
                               </div>
                            </div>

                            {!showGabarito ? (
                              <div className="flex justify-center pt-2">
                                 <button 
                                   onClick={() => setShowGabarito(true)}
                                   className="w-full py-2.5 bg-accent/10 text-accent border border-accent/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all"
                                 >
                                   Ver Gabarito
                                 </button>
                              </div>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 rounded-xl bg-accent/10 border border-accent/20"
                              >
                                 <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-[10px] font-black uppercase text-accent">Gabarito Oficial</h4>
                                    <span className="text-xs font-black text-accent">{q.resposta_correta}</span>
                                 </div>
                                 {q.explicacao && (
                                   <p className="text-[11px] text-secondary leading-relaxed italic border-t border-accent/10 pt-2 mt-2">"{q.explicacao}"</p>
                                 )}
                              </motion.div>
                            )}
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </motion.div>
                 );
               })
             )}
          </motion.div>
        </div>

      </div>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={removeFav}
        loading={isDeleting}
        title="Remover Favorito?"
        message="Deseja realmente remover este item da sua lista de favoritos? Esta ação não pode ser desfeita."
        confirmText="Sim, remover"
      />
    </motion.div>
  );
}
