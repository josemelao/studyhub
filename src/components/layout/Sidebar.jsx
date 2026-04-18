import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, BookOpen, Target, 
  BarChart3, Star, LogOut, Trophy, History, Calendar,
  Edit3, ChevronDown, Inbox
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { motion } from 'framer-motion';
import StreakWidget from '../ui/StreakWidget';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/materias', label: 'Matérias', icon: BookOpen },
  { path: '/planejador', label: 'Planejador', icon: Calendar },
  { path: '/modo-prova', label: 'Modo Prova', icon: Trophy },
  { path: '/questoes', label: 'Praticar', icon: Target },
  { path: '/progresso', label: 'Meu Progresso', icon: BarChart3 },
  { path: '/historico', label: 'Histórico', icon: History },
  { path: '/favoritos', label: 'Favoritos', icon: Star },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { workspaces, currentWorkspaceId, setWorkspace } = useWorkspace();
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch initial count
    const fetchCount = async () => {
      const { count } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      setPendingFeedbackCount(count || 0);
    };

    fetchCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('feedbacks_sidebar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedbacks' },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  return (
    <aside className="w-64 border-r border-default h-full bg-secondary/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 overflow-y-auto z-[120]">
      <div className="p-6 pb-4 flex items-center gap-3">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center shadow-glow-accent glow-accent shrink-0"
        >
          <Trophy className="w-5 h-5 text-white" />
        </motion.div>
        <span className="text-xl font-black italic tracking-tighter gradient-text truncate">StudyHub</span>
      </div>

      {workspaces.length > 0 && (
        <div className="px-6 mb-4">
          <div className="relative group">
            <select
              value={currentWorkspaceId || ''}
              onChange={(e) => setWorkspace(e.target.value)}
              className="w-full appearance-none bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-primary text-sm font-bold rounded-xl px-4 py-2.5 outline-none transition-all cursor-pointer shadow-sm truncate pr-10"
            >
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id} className="bg-[#0f0f1a] text-primary">
                  {ws.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted group-hover:text-primary transition-colors">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1.5 pt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
              ${isActive 
                ? 'bg-accent/10 text-accent font-bold border border-accent/20 shadow-accent' 
                : 'text-muted hover:text-primary hover:bg-white/[0.04] border border-transparent'}
            `}
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="text-sm tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-default space-y-2">
        {isAdmin && (
          <>
            <NavLink
              to="/gerenciar-conteudo"
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-accent/10 text-accent font-bold border border-accent/20 shadow-accent' 
                  : 'text-muted hover:text-primary hover:bg-white/[0.04] border border-transparent'}
              `}
            >
              <Edit3 className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-sm tracking-tight">Gerenciar Conteúdo</span>
            </NavLink>
            <NavLink
              to="/feedback-inbox"
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative
                ${isActive 
                  ? 'bg-accent/10 text-accent font-bold border border-accent/20 shadow-accent' 
                  : 'text-muted hover:text-primary hover:bg-white/[0.04] border border-transparent'}
              `}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="text-sm tracking-tight">Inbox Feedbacks</span>
              </div>
              
              {pendingFeedbackCount > 0 && (
                <span className="flex h-5 items-center justify-center rounded-md bg-[var(--error)] px-2 text-[10px] font-black text-white shadow-sm ring-1 ring-[var(--error-border)]">
                  {pendingFeedbackCount}
                </span>
              )}
            </NavLink>
          </>
        )}

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-error hover:bg-error/10 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
