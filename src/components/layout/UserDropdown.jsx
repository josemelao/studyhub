import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, HelpCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function UserDropdown({ profile, onOpenSettings, onOpenFeedback }) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Aluno';
  const initial = displayName.charAt(0).toUpperCase();
  const location = useLocation();

  // Fechar ao mudar de aba/rota
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Area */}
      <div 
        className="flex items-center gap-3 pl-2 cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-primary leading-none group-hover:text-accent transition-colors">
            {displayName}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">
            Estudante Premium
          </p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-lg transition-all ${
            isOpen 
              ? 'bg-gradient-accent border-accent/50 shadow-glow-accent text-white' 
              : 'bg-secondary border-white/10 text-primary hover:border-accent/30'
          }`}
        >
          <span className="font-black text-lg">{initial}</span>
        </motion.div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-3 w-80 rounded-2xl glass-card border border-default shadow-2xl overflow-hidden z-[110]"
          >
            {/* Header */}
            <div className="p-6 border-b border-default bg-secondary">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-glow-accent mb-4 border border-default">
                  <span className="text-2xl font-black text-white">{initial}</span>
                </div>
                <h3 className="text-lg font-bold text-primary mb-1 tracking-tight">{displayName}</h3>
                <p className="text-xs font-medium text-muted mb-4 truncate w-full px-4">{user?.email}</p>
                
                <div className="flex items-center">
                  <span className="px-3 py-1 rounded-lg bg-primary border border-default text-[10px] font-black text-muted uppercase tracking-widest">
                    Free
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="p-3 bg-secondary">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary hover:bg-accent/10 hover:text-accent transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-muted group-hover:text-accent" /> Configurações da Conta
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFeedback?.();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary hover:bg-accent/10 hover:text-accent transition-colors text-left mt-1"
              >
                <HelpCircle className="w-5 h-5 text-muted group-hover:text-accent" /> Ajuda e Feedback
              </button>
              
              <div className="h-px bg-border-default/50 my-2 mx-2 border-b border-default" />

              <button 
                onClick={() => signOut()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-error bg-error/5 hover:bg-error/10 border border-error/10 transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" /> Sair do StudyHub
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
