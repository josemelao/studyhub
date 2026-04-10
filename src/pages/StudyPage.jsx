import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import '../styles/markdown.css';

export default function StudyPage() {
  const { id: topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
      setAlreadyRead(true);
      navigate(`/materia/${topic.subjects?.id}`);
    } catch (err) { console.error(err); }
    finally { setMarking(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-text-muted">Carregando conteúdo...</p>
    </div>
  );

  if (error || !topic) return (
    <div className="p-8 text-center text-error">Erro: {error}</div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-28">
      <button
        onClick={() => navigate(`/materia/${topic.subjects?.id}`)}
        className="flex items-center gap-2 text-sm mb-6 text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para {topic.subjects?.nome}
      </button>

      <h1 className="text-2xl font-bold mb-8 text-text-primary">{topic.nome}</h1>

      <div className="glass-card p-7">
        {content?.conteudo ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.conteudo}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-16 text-text-muted">
            Nenhum resumo cadastrado para este tópico ainda.
          </div>
        )}
      </div>

      {/* CTA flutuante */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4">
        {alreadyRead ? (
          <div className="flex items-center justify-center gap-2 py-3 text-sm rounded-xl bg-success/10 border border-success/25 text-success">
            <Check className="w-4 h-4" /> Conteúdo marcado como lido
          </div>
        ) : (
          <button
            onClick={markAsRead}
            disabled={marking}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl bg-gradient-accent text-white shadow-glow-accent hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {marking ? 'Salvando...' : 'Marcar como Lido'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
