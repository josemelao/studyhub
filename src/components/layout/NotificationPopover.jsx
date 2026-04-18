import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Bell, Check, Trash2, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ICON_CONFIG = {
  success: { icon: CheckCircle2, color: 'var(--success)' },
  warning: { icon: AlertCircle, color: 'var(--warning)' },
  info: { icon: Info, color: 'var(--accent)' }
};

export default function NotificationPopover({ isOpen, onClose, notifications, setNotifications, onRefresh }) {
  const handleMarkAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    if (error) {
      console.error(error);
      toast.error('Erro ao marcar como lida');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);
    
    if (error) toast.error('Erro ao marcar todas como lidas');
    else toast.success('Todas as notificações foram lidas!');
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    
    // Optimistic UI update: remove from local state immediately
    if (setNotifications) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(error);
      toast.error('Erro ao excluir notificação');
      // If error, refresh to bring it back
      if (onRefresh) onRefresh();
    }
  };

  const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', 
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-16 right-16 w-80 max-h-[26rem] flex flex-col bg-secondary border border-default rounded-2xl shadow-2xl overflow-hidden z-[150]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-default bg-white/5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black text-primary tracking-tight">Notificações</h3>
            </div>
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-accent-light transition-colors"
              >
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center opacity-60">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-sm font-bold">Tudo limpo!</p>
                <p className="text-[10px] uppercase tracking-widest">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => {
                  const cfg = ICON_CONFIG[notif.type] || ICON_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                      className={`group relative flex items-start gap-3 p-4 border-b border-default transition-colors ${
                        !notif.read ? 'bg-white/[0.03] cursor-pointer hover:bg-white/[0.06]' : 'bg-transparent'
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notif.read && (
                        <div className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      )}

                      <div className="mt-0.5 flex-shrink-0">
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-xs tracking-tight ${!notif.read ? 'text-primary font-bold' : 'text-primary/80 font-medium'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5 leading-relaxed break-words line-clamp-3">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-muted/60 mt-1.5 block uppercase tracking-widest font-bold">
                          {formatDate(notif.created_at)}
                        </span>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="absolute right-3 top-4 p-1.5 rounded-lg text-muted/30 opacity-0 group-hover:opacity-100 hover:text-[var(--error)] hover:bg-[var(--error-rgb)]/10 transition-all"
                        title="Excluir notificação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
