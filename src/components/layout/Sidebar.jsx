import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart3, Settings, X, ChevronDown, CircleHelp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Matérias',  path: '/materias',  icon: BookOpen },
  { name: 'Questões',  path: '/questoes',  icon: CircleHelp },
  { name: 'Progresso', path: '/progresso', icon: BarChart3 },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 md:hidden bg-bg-primary/70 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed top-14 left-0 bottom-0 z-50 w-60
          bg-bg-primary/92 backdrop-blur-2xl
          border-r border-border-default
          transition-transform duration-300 ease-in-out md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-accent-subtle text-text-secondary hover:text-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col h-full py-4">

          {/* Concurso selector */}
          <div className="px-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-2 text-text-muted">Concurso</p>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer bg-accent-subtle border border-accent-border transition-colors hover:border-accent/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm font-medium text-text-primary">Banco do Brasil</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-2 pb-1 text-text-muted">Menu</p>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border
                  ${isActive
                    ? 'bg-accent-subtle text-accent border-accent-border shadow-accent'
                    : 'text-text-secondary border-transparent hover:bg-white/5 hover:text-text-primary'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-accent" />
                    )}
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 pt-4 border-t border-border-default">
            <div className="rounded-xl p-4 text-center bg-gradient-hero border border-border-default">
              <p className="text-xs font-medium text-text-muted mb-0.5">Plano Pro</p>
              <p className="text-xs text-text-muted">Em breve 🚀</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
