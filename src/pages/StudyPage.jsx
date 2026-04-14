import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Bookmark, Eye, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGamification } from '../hooks/useGamification';
import FavoriteButton from '../components/ui/FavoriteButton';
import { pageVariants, staggerItem, scaleIn } from '../lib/animations';
import '../styles/markdown.css';

export default function StudyPage() {
  const { id: topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { processActivity } = useGamification();

  const [topic, setTopic] = useState(null);
  const [contents, setContents] = useState({ resumo: null, video: null, dicas: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);
  const [alreadyRead, setAlreadyRead] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: topicData, error: topicError } = await supabase
          .from('topics').select('*, subjects(id, nome)').eq('id', topicId).single();
        if (topicError) throw topicError;
        setTopic(topicData);

        const { data: contentRows, error: contentError } = await supabase
          .from('contents').select('*').eq('topic_id', topicId);
        
        if (contentError) throw contentError;
        
        const mappedContents = contentRows.reduce((acc, curr) => {
          acc[curr.tipo] = curr;
          return acc;
        }, { resumo: null, video: null, dicas: null });

        setContents(mappedContents);

        const { data: prog } = await supabase
          .from('user_progress').select('conteudo_lido')
          .eq('user_id', user?.id).eq('topic_id', topicId).single();
        setAlreadyRead(prog?.conteudo_lido === true);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    loadData();
  }, [topicId, user]);

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const markAsRead = async () => {
    try {
      setMarking(true);
      await supabase.from('user_progress').upsert({
        user_id: user.id,
        topic_id: topicId,
        conteudo_lido: true,
        last_studied_at: new Date().toISOString()
      }, { onConflict: 'user_id,topic_id' });
      
      await processActivity({ leitura: true });
      setAlreadyRead(true);
      navigate(`/materia/${topic.subjects?.id}`);
    } catch (err) { console.error(err); }
    finally { setMarking(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted uppercase font-black tracking-widest">Carregando aula...</p>
    </div>
  );

  if (error || !topic) return (
    <div className="p-8 text-center text-error font-bold">Erro ao carregar conteúdo: {error}</div>
  );

  const youtubeId = getYoutubeId(contents.video?.conteudo);

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pb-32"
    >
      <motion.button
        variants={staggerItem}
        onClick={() => navigate(`/materia/${topic.subjects?.id}`)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-6 text-muted hover:text-accent transition-all group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar para {topic.subjects?.nome}
      </motion.button>

      <motion.div variants={staggerItem} className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tighter italic leading-none">{topic.nome}</h1>
          <div className="h-1 w-12 bg-accent mt-4 rounded-full" />
        </div>
        <FavoriteButton tipo="conteudo" referenciaId={topicId} />
      </motion.div>

      <div className="space-y-8">
        {/* Video Section */}
        {contents.video?.conteudo && (
          <motion.div variants={staggerItem} className="glass-card overflow-hidden border-accent/20">
            <div className="p-4 bg-accent/10 border-b border-accent/10 flex items-center gap-3">
              <Eye className="w-5 h-5 text-accent" />
              <span className="text-xs font-black uppercase tracking-widest text-primary">Videoaula Sugerida</span>
            </div>
            {youtubeId ? (
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="p-6 text-center">
                 <a href={contents.video.conteudo} target="_blank" rel="noopener noreferrer" className="text-accent font-bold underline">
                    Assistir vídeo externo
                 </a>
              </div>
            )}
          </motion.div>
        )}

        {/* Text Content */}
        <motion.div variants={staggerItem} className="glass-card p-8 md:p-12 relative overflow-hidden">
          {contents.resumo?.conteudo ? (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {contents.resumo.conteudo.replace(/\n/g, '  \n')}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-20 text-muted italic">
              Este tópico ainda não possui resumo em texto.
            </div>
          )}
        </motion.div>

        {/* Dicas / Bizus */}
        {contents.dicas?.conteudo && (
          <motion.div variants={staggerItem} className="bizu-card p-8 border-l-4 border-accent bg-accent/5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertCircle className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-primary italic">Bizu do Especialista</h3>
            </div>
            <div className="text-secondary font-medium leading-relaxed italic">
              {contents.dicas.conteudo}
            </div>
          </motion.div>
        )}
      </div>

      {/* CTA flutuante com AnimatePresence */}
      <AnimatePresence>
        <motion.div 
          variants={scaleIn}
          initial="initial"
          animate="animate"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4"
        >
          {alreadyRead ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm font-bold rounded-2xl bg-success/10 border border-success/25 text-success backdrop-blur-md shadow-lg">
              <Check className="w-5 h-5" /> Conteúdo lido
            </div>
          ) : (
            <button
              onClick={markAsRead}
              disabled={marking}
              className="w-full flex items-center justify-center gap-3 py-4 text-base font-bold rounded-2xl bg-gradient-accent text-white shadow-glow-accent hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {marking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {marking ? 'Salvando...' : 'Concluir Leitura'}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
