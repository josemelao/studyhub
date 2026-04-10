import { LogOut, Menu, User, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar({ onMenuToggle }) {
  const { user, signOut } = useAuth();
  const username = user?.email?.split('@')[0] ?? '';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-bg-primary/80 backdrop-blur-xl border-b border-border-default">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:bg-accent/10 hover:text-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-accent shadow-accent">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold hidden sm:block gradient-text">StudyHub</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 group relative cursor-pointer">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-accent-subtle text-accent border border-accent-border">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Banco do Brasil
          </div>

          <div className="h-5 w-px bg-border-default" />

          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-text-primary">{username}</span>
              <span className="text-xs text-text-muted">Concurseiro</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent-subtle border border-accent-border text-accent transition-all">
              <User className="w-4 h-4" />
            </div>
          </div>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-3 w-48 rounded-xl p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-bg-secondary border border-border-default shadow-lg">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-error hover:bg-error/10"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
