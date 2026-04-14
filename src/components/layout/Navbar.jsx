import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Bell, User, Flame, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { calculateLevel, calculateProgress } from '../../lib/levels';
import ThemePicker from '../ui/ThemePicker';

export default function Navbar() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('studyhub-theme') || 'luminary');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('studyhub-theme', theme);
  }, [theme]);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      const { data } = await supabase
        .from('user_stats')
        .select('streak_atual, pontos_xp')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setStreak(data.streak_atual || 0);
        setXp(data.pontos_xp || 0);
      }
    }
    fetchStats();

    const handleStatsUpdate = (event) => {
      const { streak_atual, pontos_xp } = event.detail;
      setStreak(streak_atual);
      setXp(pontos_xp);
    };

    window.addEventListener('stats_updated', handleStatsUpdate);
    return () => window.removeEventListener('stats_updated', handleStatsUpdate);
  }, [user]);

  return (
    <header className="h-20 border-b border-default bg-primary/50 backdrop-blur-xl flex items-center justify-between px-12 sticky top-0 z-10 md:pl-80">
         {/* Gamification Stats */}
         <div className="flex items-center gap-4">
           {streak > 0 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               whileHover={{ scale: 1.05 }}
               title="Sua sequência de dias consecutivos estudando!"
               className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-sm cursor-help"
             >
               <Flame className="w-4 h-4 fill-current animate-pulse" />
               <span className="text-[10px] font-black tracking-widest uppercase">STREAK</span>
               <span className="text-xs font-black tracking-tighter uppercase">{streak} {streak === 1 ? 'DIA' : 'DIAS'}</span>
             </motion.div>
           )}

           <motion.div 
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             title={`Nível ${calculateLevel(xp)}: Você ganha XP ao ler conteúdos, responder e acertar questões!`}
             className="flex items-center gap-3 pl-1 cursor-help"
           >
             <div className="flex flex-col items-end">
               <div className="flex items-center gap-1.5 mb-1">
                 <Zap className="w-3 h-3 text-accent fill-current" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">Nível {calculateLevel(xp)}</span>
               </div>
               <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                 <motion.div 
                   className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-accent-light shadow-glow-accent"
                   initial={{ width: 0 }}
                   animate={{ width: `${calculateProgress(xp)}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                 />
               </div>
             </div>
             
             <div className="flex flex-col border-l border-white/10 pl-3">
               <span className="text-[9px] font-black uppercase tracking-widest text-muted leading-tight">XP TOTAL</span>
               <span className="text-xs font-black text-primary tracking-tighter">{xp.toLocaleString()}</span>
             </div>
           </motion.div>
         </div>

      <div className="flex items-center gap-4">
        {/* Theme Selector Popover */}
        <div className="relative">
          <button
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className={`p-2.5 rounded-xl border transition-all group relative ${isPickerOpen ? 'bg-accent text-white border-accent shadow-glow-accent' : 'bg-secondary border-default text-muted hover:text-accent hover:border-accent/30'}`}
            title="Personalizar Apariência"
          >
            <Palette className={`w-5 h-5 group-hover:rotate-12 transition-transform ${isPickerOpen ? 'rotate-12' : ''}`} />
            {!isPickerOpen && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent animate-pulse" />}
          </button>

          <ThemePicker 
            currentTheme={theme}
            onThemeChange={setTheme}
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
          />
        </div>

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
