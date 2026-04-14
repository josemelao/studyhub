import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Sun, Moon, Terminal, Zap } from 'lucide-react';

const themes = [
  {
    id: 'luminary',
    name: 'Luminary',
    description: 'Roxo Vibrante (Dark)',
    icon: Zap,
    colors: ['#07080f', '#7c5cfc', '#c471ed']
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Âmbar Quente (Dark)',
    icon: Moon,
    colors: ['#0a0805', '#f5a623', '#ff6b6b']
  },
  {
    id: 'gravity',
    name: 'Gravity',
    description: 'Grafite CLI (Slate)',
    icon: Terminal,
    colors: ['#0f1117', '#38bdf8', '#818cf8']
  },
  {
    id: 'clean',
    name: 'Clean',
    description: 'Soft Blue (Light)',
    icon: Sun,
    colors: ['#f8fafc', '#6366f1', '#a855f7']
  }
];

export default function ThemePicker({ currentTheme, onThemeChange, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-4 w-72 z-50 bg-tertiary border border-default rounded-2xl p-2 shadow-2xl"
          >
            <div className="p-3 border-b border-white/5 mb-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                <Palette size={12} /> Presets de Aparência
              </h3>
            </div>

            <div className="space-y-1">
              {themes.map((t) => {
                const isActive = currentTheme === t.id;
                const Icon = t.icon;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onThemeChange(t.id);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-xl transition-all group
                      ${isActive ? 'bg-accent/10 border border-accent/20' : 'hover:bg-white/5 border border-transparent'}
                    `}
                  >
                    {/* Preview Circles */}
                    <div className="flex -space-x-2">
                      {t.colors.map((c, i) => (
                        <div 
                          key={i} 
                          className="w-4 h-4 rounded-full border border-white/10 shrink-0 shadow-sm"
                          style={{ backgroundColor: c, zIndex: 3 - i }}
                        />
                      ))}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black tracking-tight ${isActive ? 'text-accent' : 'text-primary'}`}>
                          {t.name}
                        </span>
                        {isActive && <Check size={12} className="text-accent" />}
                      </div>
                      <p className="text-[9px] font-bold text-muted uppercase tracking-tighter opacity-60">
                        {t.description}
                      </p>
                    </div>

                    <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-accent/20 text-accent' : 'bg-white/5 text-muted group-hover:text-primary'}`}>
                      <Icon size={14} />
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="p-3 mt-1 bg-accent/5 rounded-xl border border-accent/10">
              <p className="text-[9px] font-medium leading-relaxed text-secondary opacity-70 italic text-center">
                "Escolha o ambiente ideal para o seu foco."
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
