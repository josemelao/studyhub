import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Palette, Bell, User, Flame } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Navbar() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('studyhub-theme') || 'luminary');
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('studyhub-theme', theme);
  }, [theme]);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      const { data } = await supabase
        .from('user_stats')
        .select('streak_atual')
        .eq('user_id', user.id)
        .single();
      if (data) setStreak(data.streak_atual);
    }
    fetchStats();
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'luminary' ? 'amber' : 'luminary');
  };

  return (
    <header className="h-20 border-b border-default bg-primary/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-6">
         {streak > 0 && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             whileHover={{ scale: 1.05 }}
             className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-sm"
           >
             <Flame className="w-4 h-4 fill-current animate-pulse" />
             <span className="text-xs font-black tracking-tighter uppercase">{streak} {streak === 1 ? 'DIA' : 'DIAS'}</span>
           </motion.div>
         )}
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-secondary border border-default text-muted hover:text-accent hover:border-accent/30 transition-all group relative"
          title="Alternar Tema"
        >
          <Palette className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent animate-pulse" />
        </button>

        <button className="p-2.5 rounded-xl bg-secondary border border-default text-muted hover:text-primary transition-all">
          <Bell className="w-5 h-5" />
        </button>

        <div className="h-8 w-px bg-border-default mx-1" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-primary leading-none">
              {user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">
              Estudante Premium
            </p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center border-2 border-white/10 shadow-lg glow-accent"
          >
            <User className="w-5 h-5 text-white" />
          </motion.div>
        </div>
      </div>
    </header>
  );
}
