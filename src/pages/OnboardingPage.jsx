import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Target, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { pageVariants, staggerItem, scaleIn } from '../lib/animations';

export default function OnboardingPage() {
  const { user } = useAuth();
  const { setWorkspace, fetchWorkspaces } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [concursos, setConcursos] = useState([]);
  const [selectedConcursoId, setSelectedConcursoId] = useState(null);

  useEffect(() => {
    async function fetchConcursos() {
      const { data } = await supabase.from('concursos').select('id, nome, sigla').order('nome');
      if (data) setConcursos(data);
    }
    fetchConcursos();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim() || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName,
          user_id: user.id,
          concurso_id: selectedConcursoId
        })
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar a lista de workspaces e o ativo no contexto
      await fetchWorkspaces();
      setWorkspace(data.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-xl glass-card p-10 relative z-10 border-white/10 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <motion.div variants={scaleIn} className="w-16 h-16 bg-gradient-accent rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-accent">
            <Rocket className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1 variants={staggerItem} className="text-4xl font-black text-primary tracking-tighter">
            Bem-vindo ao <span className="gradient-text italic">StudyHub</span>
          </motion.h1>
          <motion.p variants={staggerItem} className="text-muted text-sm font-medium px-4">
            Parece que você ainda não tem um ambiente de estudos configurado. Vamos criar o seu primeiro Workspace?
          </motion.p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <motion.div variants={staggerItem} className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted ml-1">Nome do Workspace</label>
            <input 
              type="text"
              required
              placeholder="Ex: Banco do Brasil 2024, Residência Médica..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-primary font-bold focus:border-accent/50 focus:ring-4 focus:ring-accent/10 outline-none transition-all placeholder:text-white/20"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </motion.div>

          <motion.div variants={staggerItem} className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted ml-1 flex items-center gap-2">
              <Target className="w-3 h-3" /> Concurso Alvo (Opcional)
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 thin-scrollbar">
              {concursos.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConcursoId(c.id === selectedConcursoId ? null : c.id)}
                  className={`flex items-center justify-between px-5 py-3 rounded-xl border transition-all text-left ${
                    selectedConcursoId === c.id 
                    ? 'bg-accent text-white border-accent shadow-glow-accent' 
                    : 'bg-white/5 border-white/5 text-muted hover:border-white/20'
                  }`}
                >
                  <span className="text-sm font-bold truncate">{c.nome}</span>
                  {selectedConcursoId === c.id && <Sparkles className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.button
            variants={staggerItem}
            type="submit"
            disabled={loading || !workspaceName.trim()}
            className="w-full bg-gradient-accent text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-glow-accent hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Começar Jornada
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>

        <motion.p variants={staggerItem} className="text-[10px] text-center text-muted/50 font-bold uppercase tracking-widest">
            A qualquer momento você poderá criar novos workspaces para outros objetivos.
        </motion.p>
      </motion.div>
    </div>
  );
}
