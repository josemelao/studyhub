import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGamification } from '../hooks/useGamification';
import { pageVariants, staggerItem, scaleIn } from '../lib/animations';
import '../styles/markdown.css';

export default function StudyPage() {
  const { id: topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { processActivity } = useGamification();

  const [topic, setTopic] = useState(null);
  const [content, setContent] = useState(null);
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

        const { data: contentData, error: contentError } = await supabase
          .from('contents').select('*').eq('topic_id', topicId).eq('tipo', 'resumo').single();
        if (contentError && contentError.code !== 'PGRST116') throw contentError;
        setContent(contentData);

        const { data: prog } = await supabase
          .from('user_progress').select('conteudo_lido')
          .eq('user_id', user.id).eq('topic_id', topicId).single();
        setAlreadyRead(prog?.conteudo_lido === true);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    loadData();
  }, [topicId, user]);

  const markAsRead = async () => {
    try {
      setMarking(true);
      await supabase.from('user_progress').upsert({
        user_id: user.id,
        topic_id: topicId,
        conteudo_lido: true,
        last_studied_at: new Date().toISOString()
      }, { onConflict: 'user_id,topic_id' });
      
      // Atualizar Stats e Streaks usando o novo sistema centralizado
      await processActivity({ leitura: true });

      setAlreadyRead(true);
      navigate(`/materia/${topic.subjects?.id}`);
    } catch (err) { console.error(err); }
    finally { setMarking(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-muted">Carregando conteúdo...</p>
    </div>
  );

  if (error || !topic) return (
    <div className="p-8 text-center text-error">Erro: {error}</div>
  );

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
        className="flex items-center gap-2 text-sm mb-6 text-secondary hover:text-primary transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar para {topic.subjects?.nome}
      </motion.button>

      <motion.div variants={staggerItem} className="flex justify-between items-start mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">{topic.nome}</h1>
        <FavoriteButton tipo="conteudo" referenciaId={topicId} />
      </motion.div>

      <motion.div variants={staggerItem} className="glass-card p-8 md:p-10">
        {content?.conteudo ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.conteudo}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-20 text-muted">
            Nenhum resumo cadastrado para este tópico ainda.
          </div>
        )}
      </motion.div>

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
