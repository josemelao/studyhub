import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-text-primary">
      <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
      <p className="text-text-secondary animate-pulse text-sm">Carregando...</p>
    </div>
  );
}
