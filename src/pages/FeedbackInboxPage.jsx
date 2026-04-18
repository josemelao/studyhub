import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Inbox, Bug, Lightbulb, HelpCircle, Clock, CheckCircle, RefreshCw, Loader2, ChevronDown, ChevronUp, User, Trophy, LayoutDashboard } from 'lucide-react';

const TYPE_CONFIG = {
  bug: { label: 'Problema', icon: Bug, color: 'var(--error)', bg: 'rgba(var(--error-rgb), 0.08)', border: 'rgba(var(--error-rgb), 0.2)' },
  suggestion: { label: 'Sugestão', icon: Lightbulb, color: 'var(--warning)', bg: 'rgba(var(--warning-rgb), 0.08)', border: 'rgba(var(--warning-rgb), 0.2)' },
  help: { label: 'Ajuda', icon: HelpCircle, color: 'var(--accent)', bg: 'var(--accent-subtle)', border: 'var(--accent-border)' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pendente', icon: Clock, color: 'var(--warning)', bg: 'rgba(var(--warning-rgb), 0.08)' },
  reviewed: { label: 'Revisado', icon: RefreshCw, color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  resolved: { label: 'Resolvido', icon: CheckCircle, color: 'var(--success)', bg: 'rgba(var(--success-rgb), 0.08)' },
};

function FeedbackCard({ item, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const type = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.help;
  const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    const { error } = await supabase
      .from('feedbacks')
      .update({ status: newStatus })
      .eq('id', item.id);
    
    if (!error) {
      // Create notification for the user if applicable
      if (item.user_id && newStatus !== 'pending') {
        const title = newStatus === 'resolved' ? 'Feedback Resolvido' : 'Feedback Revisado';
        const message = newStatus === 'resolved' 
          ? `Sua solicitação de ${type.label.toLowerCase()} foi resolvida pela equipe.` 
          : `Sua solicitação de ${type.label.toLowerCase()} foi revisada no sistema.`;
        
        await supabase.from('notifications').insert({
          user_id: item.user_id,
          title,
          message,
          type: newStatus === 'resolved' ? 'success' : 'info'
        });
      }
      onStatusChange(item.id, newStatus);
    }
    setUpdating(false);
  };

  const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Type badge */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: type.bg, border: `1px solid ${type.border}` }}
        >
          <TypeIcon className="w-4 h-4" style={{ color: type.color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: type.color }}>
              {type.label}
            </span>
            <span className="text-muted text-xs">•</span>
            <span className="text-xs text-muted">{formatDate(item.created_at)}</span>
          </div>
          <p className="text-sm text-primary font-medium mt-0.5 truncate">{item.message}</p>
          <div className="flex items-center gap-4 mt-1">
            {item.user_email && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-muted" />
                <span className="text-[10px] text-muted">{item.user_email}</span>
              </div>
            )}
            {item.concursos?.nome ? (
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-accent" />
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{item.concursos.nome}</span>
              </div>
            ) : item.workspaces?.name ? (
              <div className="flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4 text-accent/70" />
                <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">{item.workspaces.name}</span>
              </div>
            ) : item.concurso_id || item.workspace_id ? (
              <div className="flex items-center gap-1 opacity-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted italic">ID Contexto: {(item.concurso_id || item.workspace_id).slice(0,8)}...</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0"
          style={{ background: status.bg, color: status.color }}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>

        {/* Expand icon */}
        <div className="text-muted flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-default pt-4 space-y-4">
              {/* Full message */}
              <div
                className="rounded-xl p-4 text-sm text-primary whitespace-pre-wrap leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
              >
                {item.message}
              </div>

              {/* Status actions */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted font-bold uppercase tracking-widest mr-1">Atualizar status:</span>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = item.status === key;
                  return (
                    <button
                      key={key}
                      disabled={isActive || updating}
                      onClick={() => handleStatusChange(key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      style={{
                        background: isActive ? cfg.bg : 'transparent',
                        color: isActive ? cfg.color : 'var(--text-muted)',
                        border: `1px solid ${isActive ? cfg.color : 'var(--border)'}`,
                      }}
                    >
                      {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FeedbackInboxPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | reviewed | resolved
  const [typeFilter, setTypeFilter] = useState('all'); // all | bug | suggestion | help

  const loadFeedbacks = async () => {
    setLoading(true);
    let query = supabase
      .from('feedbacks')
      .select('*, concursos(nome), workspaces(name)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('status', filter);
    if (typeFilter !== 'all') query = query.eq('type', typeFilter);

    const { data } = await query;
    setFeedbacks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadFeedbacks(); }, [filter, typeFilter]);

  // Sincronização em Tempo Real (Realtime)
  useEffect(() => {
    const channel = supabase
      .channel('feedback_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedbacks' },
        () => {
          // Pequeno delay para garantir que o banco processou a mudança antes de buscarmos
          setTimeout(() => loadFeedbacks(), 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, typeFilter]); // Re-inscrever se filtros mudarem para garantir consistência

  const handleStatusChange = (id, newStatus) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  const counts = {
    all: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    reviewed: feedbacks.filter(f => f.status === 'reviewed').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tighter italic flex items-center gap-3">
            <Inbox className="text-accent" />
            Inbox de Feedbacks
          </h1>
          <p className="text-sm text-muted mt-1 uppercase tracking-widest font-bold">
            Mensagens e pedidos de ajuda dos usuários
          </p>
        </div>
        <button
          onClick={loadFeedbacks}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-default rounded-xl text-sm font-bold text-muted hover:text-primary hover:bg-white/10 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Atualizar
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <div className="flex bg-white/5 border border-default rounded-xl p-1 gap-1">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendentes' },
            { key: 'reviewed', label: 'Revisados' },
            { key: 'resolved', label: 'Resolvidos' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: filter === key ? 'var(--accent)' : 'transparent',
                color: filter === key ? 'white' : 'var(--text-muted)',
              }}
            >
              {label} {key === 'all' ? `(${feedbacks.length})` : `(${counts[key]})`}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex bg-white/5 border border-default rounded-xl p-1 gap-1">
          {[{ key: 'all', label: 'Tipo: Todos' }, ...Object.entries(TYPE_CONFIG).map(([key, cfg]) => ({ key, label: cfg.label }))].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: typeFilter === key ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: typeFilter === key ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center gap-3">
          <Inbox className="w-12 h-12 text-muted/40" />
          <p className="text-primary font-bold">Nenhum feedback encontrado</p>
          <p className="text-sm text-muted">
            {filter !== 'all' || typeFilter !== 'all'
              ? 'Tente remover os filtros.'
              : 'Os feedbacks dos usuários aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {feedbacks.map((item) => (
              <FeedbackCard key={item.id} item={item} onStatusChange={handleStatusChange} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
