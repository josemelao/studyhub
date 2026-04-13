import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Target, 
  BarChart3, Star, LogOut, Trophy 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import StreakWidget from '../ui/StreakWidget';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/materias', label: 'Matérias', icon: BookOpen },
  { path: '/modo-prova', label: 'Modo Prova', icon: Trophy },
  { path: '/questoes', label: 'Praticar', icon: Target },
  { path: '/progresso', label: 'Meu Progresso', icon: BarChart3 },
  { path: '/favoritos', label: 'Favoritos', icon: Star },
];

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="w-64 border-r border-default h-full bg-secondary/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 overflow-y-auto z-20">
      <div className="p-8 flex items-center gap-3">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center shadow-glow-accent glow-accent"
        >
          <Trophy className="w-5 h-5 text-white" />
        </motion.div>
        <span className="text-xl font-black italic tracking-tighter gradient-text">StudyHub</span>
      </div>

      <div className="mb-4">
        <StreakWidget />
      </div>

      <nav className="flex-1 px-4 space-y-1.5 pt-4">
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

      <div className="p-4 border-t border-default">
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
