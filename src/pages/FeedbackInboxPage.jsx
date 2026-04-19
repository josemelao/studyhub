import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Inbox, Bug, Lightbulb, HelpCircle, Clock, CheckCircle, RefreshCw, Loader2, ChevronDown, ChevronUp, User, Trophy, LayoutDashboard, Trash2 } from 'lucide-react';

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

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este feedback permanentemente?')) return;
    
    setUpdating(true);
    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', item.id);
    
    if (error) {
      alert('Erro ao excluir: ' + error.message);
      setUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: type.bg, border: `1px solid ${type.border}` }}
        >
          <TypeIcon className="w-4 h-4" style={{ color: type.color }} />
        </div>

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
            ) : null}
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0"
          style={{ background: status.bg, color: status.color }}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>

        <div className="text-muted flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-default pt-4 space-y-4">
              <div
                className="rounded-xl p-4 text-sm text-primary whitespace-pre-wrap leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
              >
                {item.message}
              </div>

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
                <div className="flex-1" />
                <button
                  disabled={updating}
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-error border border-error/20 hover:bg-error/10 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default function FeedbackInboxPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadFeedbacks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feedbacks')
      .select('*, concursos(nome), workspaces(name)')
      .order('created_at', { ascending: false });

    setFeedbacks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadFeedbacks(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('feedback_granular_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedbacks' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('feedbacks')
              .select('*, concursos(nome), workspaces(name)')
              .eq('id', payload.new.id)
              .single();
            
            if (data) setFeedbacks(prev => [data, ...prev]);
          } 
          else if (payload.eventType === 'UPDATE') {
            setFeedbacks(prev => prev.map(item => 
              item.id === payload.new.id ? { ...item, ...payload.new } : item
            ));
          } 
          else if (payload.eventType === 'DELETE') {
            setFeedbacks(prev => prev.filter(f => f.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  const counts = {
    all: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    reviewed: feedbacks.filter(f => f.status === 'reviewed').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesStatus = filter === 'all' || f.status === filter;
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    return matchesStatus && matchesType;
  });

  // Divisão manual em 2 colunas para independência de altura (Masonry)
  const leftColumn = filteredFeedbacks.filter((_, i) => i % 2 === 0);
  const rightColumn = filteredFeedbacks.filter((_, i) => i % 2 !== 0);

  return (
    <div className="w-full space-y-8 pb-12">
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

      <div className="flex flex-wrap gap-3">
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
              {label} ({counts[key]})
            </button>
          ))}
        </div>

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

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
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
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Coluna Esquerda */}
          <div className="flex-1 w-full space-y-4">
            {leftColumn.map((item) => (
              <FeedbackCard key={item.id} item={item} onStatusChange={handleStatusChange} />
            ))}
          </div>
          
          {/* Coluna Direita (oculta se vazia ou em mobile se preferir, mas aqui mantido responsivo) */}
          {rightColumn.length > 0 && (
            <div className="flex-1 w-full space-y-4">
              {rightColumn.map((item) => (
                <FeedbackCard key={item.id} item={item} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
