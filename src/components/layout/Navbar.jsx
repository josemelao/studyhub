import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Bell, User, Flame, Zap, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { calculateLevel, calculateProgress } from '../../lib/levels';
import ThemePicker from '../ui/ThemePicker';
import UserDropdown from './UserDropdown';
import SettingsPanel from './SettingsPanel';
import FeedbackModal from '../common/FeedbackModal';
import NotificationPopover from './NotificationPopover';

export default function Navbar() {
  const { user, profile } = useAuth();
  const getThemeKey = (userId) => `studyhub_theme_${userId}`;
  const [theme, setTheme] = useState('luminary');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  const location = useLocation();
  const themeRef = useRef(null);
  const notifyRef = useRef(null);

  // Close everything on route change
  useEffect(() => {
    setIsPickerOpen(false);
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
    setIsFeedbackOpen(false);
  }, [location.pathname]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setIsPickerOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();
    
    const channel = supabase
      .channel(`notifications_realtime_${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        },
        () => {
          // Delay de segurança para commit do banco
          setTimeout(() => fetchNotifications(), 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    setNotifications(data || []);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const savedTheme = localStorage.getItem(getThemeKey(user.id)) || 'luminary';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, [user]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    if (user) {
      localStorage.setItem(getThemeKey(user.id), newTheme);
    }
  };

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_stats')
        .select('streak_atual, pontos_xp')
        .eq('user_id', user.id)
        .maybeSingle();
      
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
    <header className="h-20 border-b border-default bg-primary/50 backdrop-blur-xl flex items-center justify-between px-12 sticky top-0 z-[100] md:pl-80">
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
        <div className="relative" ref={themeRef}>
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
            onThemeChange={handleThemeChange}
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
          />
        </div>

        <div className="relative" ref={notifyRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2.5 rounded-xl border transition-all group relative ${isNotificationsOpen ? 'bg-accent text-white border-accent shadow-glow-accent' : 'bg-secondary border-default text-muted hover:text-primary hover:border-accent/30'}`}
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--error)] text-[9px] font-black text-white shadow-sm ring-2 ring-[var(--bg-default)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <NotificationPopover 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
            notifications={notifications} 
            setNotifications={setNotifications}
            onRefresh={fetchNotifications}
          />
        </div>

        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2.5 rounded-xl bg-secondary border border-default text-muted hover:text-primary transition-all hover:border-accent/30"
          title="Configurações"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="h-8 w-px bg-border-default mx-1" />

        <UserDropdown profile={profile} onOpenSettings={() => setIsSettingsOpen(true)} onOpenFeedback={() => setIsFeedbackOpen(true)} />
      </div>

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
      />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </header>
  );
}
