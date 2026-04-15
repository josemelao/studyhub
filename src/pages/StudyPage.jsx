import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Check, Loader2, Bookmark, Eye, 
  AlertCircle, Play, FileText, Save, History 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useGamification } from '../hooks/useGamification';
import FavoriteButton from '../components/ui/FavoriteButton';
import { pageVariants, staggerItem, scaleIn } from '../lib/animations';
import '../styles/markdown.css';

export default function StudyPage() {
  const { id: topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { processActivity } = useGamification();

  const [topic, setTopic] = useState(null);
  const [contents, setContents] = useState({ resumo: null, videos: [], dicas: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);
  const [alreadyRead, setAlreadyRead] = useState(false);

  // Estado para Vídeo Ativo
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!user || !currentWorkspaceId) return;
      try {
        setLoading(true);
        // 1. Carregar Tópico
        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .select('*, subjects(id, nome)')
          .eq('id', topicId)
          .eq('workspace_id', currentWorkspaceId)
          .single();
        if (topicError) throw topicError;
        setTopic(topicData);

        // 2. Carregar Conteúdos (Suporte a múltiplos links por linha)
        const { data: contentRows, error: contentError } = await supabase
          .from('contents')
          .select('*')
          .eq('topic_id', topicId)
          .eq('workspace_id', currentWorkspaceId);
        
        if (contentError) throw contentError;
        
        const mappedContents = contentRows.reduce((acc, curr) => {
          if (curr.tipo === 'video') {
            // Suporte a múltiplos links: quebra por linha e limpa espaços
            const links = curr.conteudo.split('\n').filter(link => link.trim() !== '');
            links.forEach((url, index) => {
              acc.videos.push({ 
                id: `${curr.id}-${index}`, 
                conteudo: url.trim() 
              });
            });
          } else {
            acc[curr.tipo] = curr;
          }
          return acc;
        }, { resumo: null, videos: [], dicas: null });

        setContents(mappedContents);

        // 3. Carregar Progresso
        const { data: prog } = await supabase
          .from('user_progress')
          .select('conteudo_lido')
          .eq('user_id', user.id)
          .eq('topic_id', topicId)
          .eq('workspace_id', currentWorkspaceId)
          .maybeSingle();
        setAlreadyRead(prog?.conteudo_lido === true);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    loadData();
  }, [topicId, user, currentWorkspaceId]);

  // Lógica de Autosave para Notas removida (agora no NotesWidget)

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
        workspace_id: currentWorkspaceId,
        topic_id: topicId,
        conteudo_lido: true,
        last_studied_at: new Date().toISOString()
      }, { onConflict: 'user_id,workspace_id,topic_id' });
      
      await processActivity({ leitura: true });
      setAlreadyRead(true);
      navigate(`/materia/${topic.subjects?.id}`);
    } catch (err) { console.error(err); }
    finally { setMarking(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <div className="absolute inset-0 blur-lg bg-accent/20 animate-pulse" />
      </div>
      <p className="text-[10px] text-muted uppercase font-black tracking-[0.3em]">Sincronizando Estação...</p>
    </div>
  );

  if (error || !topic) return (
    <div className="p-12 text-center max-w-md mx-auto h-[60vh] flex flex-col justify-center items-center gap-6">
      <div className="w-20 h-20 rounded-3xl bg-error/10 flex items-center justify-center text-error border border-error/20">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-xl font-black text-primary italic tracking-tight">Ops! Algo deu errado.</h2>
      <p className="text-sm text-secondary leading-relaxed">{error || 'Tópico não encontrado.'}</p>
      <button onClick={() => navigate(-1)} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10">Voltar</button>
    </div>
  );

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pb-32 px-4 md:px-0"
    >
      {/* Header com Navegação */}
      <motion.nav variants={staggerItem} className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(`/materia/${topic.subjects?.id}`)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-accent transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Voltar para {topic.subjects?.nome}
        </button>
        <div className="flex items-center gap-4">
          <FavoriteButton tipo="conteudo" referenciaId={topicId} />
        </div>
      </motion.nav>

      {/* Título Principal */}
      <motion.div variants={staggerItem} className="mb-12">
        <h1 className="text-5xl font-black text-primary tracking-tighter italic leading-tight max-w-4xl">
          {topic.nome}
        </h1>
        <div className="h-1.5 w-16 bg-gradient-accent mt-6 rounded-full shadow-glow-accent" />
      </motion.div>

      {/* Grid Principal: Conteúdo + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Lado Esquerdo: Conteúdo Pedagógico (8/12) */}
        <div className="lg:col-span-8 space-y-10 order-2 lg:order-1">
          {/* Resumo em Texto */}
          <motion.div variants={staggerItem} className="glass-card p-8 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            {contents.resumo?.conteudo ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {contents.resumo.conteudo.replace(/\n/g, '  \n')}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 grayscale opacity-30">
                <FileText className="w-16 h-16 mb-6" />
                <p className="text-xs font-black uppercase tracking-widest italic">Aguardando Apostila...</p>
              </div>
            )}
          </motion.div>

          {/* Dicas / Bizus */}
          {contents.dicas?.conteudo && (
            <motion.div variants={staggerItem} className="bizu-card p-10 border-l-4 border-accent bg-accent/5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <AlertCircle className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent shadow-glow-accent/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary italic">Bizu do Especialista</h3>
              </div>
              <div className="text-secondary text-lg font-medium leading-relaxed italic relative z-10">
                {contents.dicas.conteudo}
              </div>
            </motion.div>
          )}
        </div>

        {/* Lado Direito: Sidebar FIXA com Scroll Independente (4/12) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 order-1 lg:order-2">
          <div className="lg:max-h-[calc(100vh-140px)] overflow-y-auto pr-2 sidebar-scroll space-y-8">
            
            {/* Widget de Vídeos (Playlist Style) */}
            {contents.videos.length > 0 && (
              <motion.div variants={staggerItem} className="glass-card border-accent/20 overflow-hidden shadow-xl">
                <div className="p-4 bg-accent/10 border-b border-accent/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Play className="w-4 h-4 text-accent fill-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Videoaula Ativa</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-accent/20 text-accent rounded-full uppercase">
                    {activeVideoIndex + 1} / {contents.videos.length}
                  </span>
                </div>
                
                {/* Player Principal */}
                <div className="bg-black aspect-video">
                  {getYoutubeId(contents.videos[activeVideoIndex]?.conteudo) ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYoutubeId(contents.videos[activeVideoIndex].conteudo)}`}
                      title="Player Principal"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="h-full flex items-center justify-center p-6 text-center">
                       <a href={contents.videos[activeVideoIndex]?.conteudo} target="_blank" rel="noopener noreferrer" className="text-accent text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                          Assistir Aula Externa <Eye size={12}/>
                       </a>
                    </div>
                  )}
                </div>

                {/* Playlist de Thumbnails */}
                {contents.videos.length > 1 && (
                  <div className="p-4 bg-white/[0.02] border-t border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-3">Trocar de Vídeo:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {contents.videos.map((vid, idx) => {
                        const yId = getYoutubeId(vid.conteudo);
                        return (
                          <button
                            key={vid.id}
                            onClick={() => setActiveVideoIndex(idx)}
                            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                              activeVideoIndex === idx 
                                ? 'border-accent shadow-glow-accent/30' 
                                : 'border-transparent opacity-50 hover:opacity-100'
                            }`}
                          >
                            {yId ? (
                              <img 
                                src={`https://img.youtube.com/vi/${yId}/mqdefault.jpg`} 
                                alt={`Vídeo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center text-[8px] font-bold">
                                V{idx+1}
                              </div>
                            )}
                            {activeVideoIndex === idx && (
                              <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white shadow-xl" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Widget de Notas Personalizadas (Componente Isolado para Performance) */}
            <NotesWidget topicId={topicId} user={user} />
          </div>
        </aside>
      </div>

      {/* Barra de Progresso / CTA */}
      <AnimatePresence>
        <motion.div 
          variants={scaleIn}
          initial="initial"
          animate="animate"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs px-4"
        >
          {alreadyRead ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm font-bold rounded-2xl bg-success/10 border border-success/25 text-success backdrop-blur-xl shadow-2xl border-b-4 border-b-success/20">
              <Check className="w-5 h-5" /> Meta Concluída
            </div>
          ) : (
            <button
              onClick={markAsRead}
              disabled={marking}
              className="w-full flex items-center justify-center gap-3 py-4 text-base font-bold rounded-2xl bg-gradient-accent text-white shadow-glow-accent hover:scale-[1.05] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed border-b-4 border-b-black/20"
            >
              {marking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {marking ? 'Registrando...' : 'Concluir Tópico'}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// Pequeno helper de ícone customizado
function Edit3Icon(props) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
}

// Componente Isolado para Notas (Evita re-render da página inteira)
function NotesWidget({ topicId, user }) {
  const { currentWorkspaceId } = useWorkspace();
  const [notes, setNotes] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    async function loadNotes() {
      if (!user || !topicId || !currentWorkspaceId) return;
      try {
        setLoading(true);
        const { data: notesData } = await supabase
          .from('user_topic_notes').select('content, updated_at')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('topic_id', topicId)
          .maybeSingle();
        
        if (notesData) {
          setNotes(notesData.content || '');
          setLastSaved(new Date(notesData.updated_at));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadNotes();
  }, [topicId, user, currentWorkspaceId]);

  useEffect(() => {
    if (!topicId || !user || loading) return;

    const saveNotes = async () => {
      if (!currentWorkspaceId) return;
      setIsSaving(true);
      try {
        await supabase.from('user_topic_notes').upsert({
          user_id: user.id,
          workspace_id: currentWorkspaceId,
          topic_id: topicId,
          content: notes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,workspace_id,topic_id' });
        setLastSaved(new Date());
      } catch (err) { console.error('Erro:', err); }
      finally { setIsSaving(false); }
    };

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveNotes, 1000);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [notes]);

  if (loading) return (
    <div className="glass-card border-primary/5 min-h-[400px] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-accent/30" />
    </div>
  );

  return (
    <motion.div variants={staggerItem} className="glass-card border-primary/5 shadow-2xl flex flex-col min-h-[450px]">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Edit3Icon className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Caderno de Notas</span>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isSaving ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-accent">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[8px] font-black uppercase">Salvando...</span>
              </motion.div>
            ) : lastSaved && (
              <div className="flex items-center gap-1.5 text-muted/60">
                <Check className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase">Sincronizado</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 relative p-1 bg-white/[0.01]">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escreva suas anotações aqui... (Salvo automaticamente)"
          className="w-full h-full min-h-[400px] bg-transparent p-6 text-sm text-secondary font-medium outline-none resize-none leading-relaxed placeholder:italic placeholder:opacity-20"
        />
        <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none opacity-[0.03] space-y-6 pt-12 px-6">
          {[...Array(15)].map((_, i) => <div key={i} className="h-[1px] bg-white w-full" />)}
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted">
            <History className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase">Notas salvas por tópico</span>
        </div>
      </div>
    </motion.div>
  );
}
