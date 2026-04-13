import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, BookOpen, CircleHelp, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { pageVariants, staggerContainer, staggerItem, expandDown } from '../lib/animations';

export default function FavoritesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('conteudo'); // 'conteudo' | 'questao'
  const [favs, setFavs] = useState({ conteudo: [], questao: [] });
  const [openQ, setOpenQ] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id);
        
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
            .select('id, enunciado, resposta_correta, explicacao, topic_id(nome, subjects(nome, cor))')
            .in('id', quesIds);
          quesData = d || [];
        }

        setFavs({ conteudo: contData, questao: quesData });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  const removeFav = async (tipo, id) => {
    try {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('tipo', tipo).eq('referencia_id', id);
      setFavs(prev => ({
        ...prev,
        [tipo]: prev[tipo].filter(f => f.id !== id)
      }));
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted">Carregando seus favoritos...</p>
    </div>
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pb-20 space-y-10">
      <motion.section variants={staggerItem}>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-accent/10 text-accent glow-accent">
            <Star className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Favoritos</h1>
        </div>
        <p className="text-sm text-muted ml-14">
          Tudo que você salvou para revisar depois está aqui.
        </p>
      </motion.section>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-secondary border border-default rounded-2xl w-full max-w-md">
        <button
          onClick={() => setTab('conteudo')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'conteudo' ? 'bg-gradient-accent text-white shadow-glow-accent' : 'text-muted hover:text-secondary'}`}
        >
          <BookOpen className="w-4 h-4" /> Conteúdos
        </button>
        <button
          onClick={() => setTab('questao')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'questao' ? 'bg-gradient-accent text-white shadow-glow-accent' : 'text-muted hover:text-secondary'}`}
        >
          <CircleHelp className="w-4 h-4" /> Questões
        </button>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {tab === 'conteudo' && (
          favs.conteudo.length === 0 ? (
            <div className="glass-card p-12 text-center text-muted">Nenhum conteúdo favorito.</div>
          ) : (
            favs.conteudo.map(c => (
              <motion.div key={c.id} variants={staggerItem} className="glass-card flex items-center justify-between p-6 group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-primary group-hover:text-accent transition-colors truncate">{c.nome}</h3>
                    <p className="text-xs text-muted truncate">{c.subjects?.nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                   <button onClick={() => removeFav('conteudo', c.id)} className="p-2 text-muted hover:text-error transition-colors">
                      <Trash2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => navigate(`/estudo/${c.id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-accent-subtle text-accent rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent/20 transition-all">
                      Estudar <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </motion.div>
            ))
          )
        )}

        {tab === 'questao' && (
          favs.questao.length === 0 ? (
            <div className="glass-card p-12 text-center text-muted">Nenhuma questão favorita.</div>
          ) : (
            favs.questao.map(q => {
              const isOpen = openQ === q.id;
              return (
                <motion.div key={q.id} variants={staggerItem} className="glass-card !p-0 overflow-hidden">
                  <div className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                        <CircleHelp className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className="font-bold text-primary truncate">{q.enunciado}</h3>
                         <p className="text-xs text-muted truncate">{q.topic_id?.subjects?.nome} · {q.topic_id?.nome}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                       <button onClick={() => removeFav('questao', q.id)} className="p-2 text-muted hover:text-error transition-colors">
                          <Trash2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => setOpenQ(isOpen ? null : q.id)} className={`p-2 rounded-lg transition-all ${isOpen ? 'bg-accent text-white' : 'bg-secondary text-muted'}`}>
                          <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                       </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div variants={expandDown} initial="initial" animate="animate" exit="exit" className="p-8 border-t border-default bg-secondary/30">
                         <p className="text-base font-bold text-primary mb-6 italic leading-relaxed">"{q.enunciado}"</p>
                         <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                            <h4 className="text-[10px] font-black uppercase text-accent mb-2">Gabarito</h4>
                            <p className="text-sm font-bold text-primary">Resposta: {q.resposta_correta}</p>
                            <p className="text-xs text-secondary mt-2 leading-relaxed">"{q.explicacao}"</p>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )
        )}
      </motion.div>
    </motion.div>
  );
}
