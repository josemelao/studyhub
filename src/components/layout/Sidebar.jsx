import { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, BookOpen, Target, 
  BarChart3, Star, LogOut, Trophy, History, Calendar,
  Edit3, ChevronDown, Inbox
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const workspaceRef = useRef(null);

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch initial count
    const fetchCount = async () => {
      const { data, count, error } = await supabase
        .from('feedbacks')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');
      
      if (!error) {
        setPendingFeedbackCount(count || 0);
      }
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

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target)) {
        setIsWorkspaceOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentWorkspace = workspaces.find(ws => ws.id === currentWorkspaceId);

  return (
    <aside className="w-64 border-r border-default h-full bg-secondary/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 overflow-y-auto z-[120]">
      <Link 
        to="/dashboard" 
        className="p-6 pb-8 flex items-center gap-4 group cursor-pointer transition-all active:scale-95"
      >
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow-accent glow-accent shrink-0 group-hover:shadow-glow-accent/50 transition-all"
        >
          <Trophy className="w-6 h-6 text-white" />
        </motion.div>
        <span className="text-2xl font-black italic tracking-tighter gradient-text truncate">StudyHub</span>
      </Link>

      {workspaces.length > 0 && (
        <div className="px-6 mb-6" ref={workspaceRef}>
          <div className="relative">
            {/* Custom Trigger */}
            <button
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className={`w-full flex items-center justify-between gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 transition-all duration-200 group ${
                isWorkspaceOpen ? 'border-accent/40 bg-white/[0.08] shadow-glow-accent/10' : ''
              }`}
            >
              <span className="text-sm font-bold text-primary truncate">
                {currentWorkspace?.name || 'Selecionar Edital'}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted group-hover:text-primary transition-transform duration-300 ${isWorkspaceOpen ? 'rotate-180 text-accent' : ''}`} />
            </button>

            {/* Custom Dropdown List */}
            <AnimatePresence>
              {isWorkspaceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute left-0 right-0 mt-2 p-2 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl z-[130] backdrop-blur-xl"
                >
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          setWorkspace(ws.id);
                          setIsWorkspaceOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          ws.id === currentWorkspaceId
                            ? 'bg-accent/10 text-accent'
                            : 'text-muted hover:bg-white/5 hover:text-primary'
                        }`}
                      >
                        {ws.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
