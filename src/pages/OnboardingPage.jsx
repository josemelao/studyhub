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
  const [concursos, setConcursos] = useState([]);
  const [selectedConcursoId, setSelectedConcursoId] = useState(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    async function fetchConcursos() {
      // Busca apenas concursos que já possuem matérias cadastradas pelo admin
      const { data: subjectsWithConcurso } = await supabase
        .from('subjects')
        .select('concurso_id')
        .not('concurso_id', 'is', null);

      const validIds = [...new Set((subjectsWithConcurso || []).map(s => s.concurso_id))];
      if (!validIds.length) return;

      const { data } = await supabase
        .from('concursos')
        .select('id, nome, sigla')
        .in('id', validIds)
        .order('nome');
      if (data) setConcursos(data);
    }
    fetchConcursos();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedConcursoId || !user || !displayName.trim()) return;

    try {
      setLoading(true);
      
      const selectedConcurso = concursos.find(c => c.id === selectedConcursoId);
      const name = selectedConcurso ? selectedConcurso.nome : 'Meu Workspace';

      // 1. Atualiza/Cria Perfil do Usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 2. Cria o Workspace
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: name,
          user_id: user.id,
          concurso_id: selectedConcursoId
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchWorkspaces();
      setWorkspace(data.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-start justify-center p-6 pt-[4vh] relative overflow-hidden">
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-xl glass-card p-10 relative z-10 border-0 space-y-8"
      >
        <div className="text-center space-y-2">
          <motion.div variants={scaleIn} className="w-16 h-16 bg-gradient-accent rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-accent">
            <Rocket className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1 variants={staggerItem} className="text-4xl font-black text-primary tracking-tighter">
            Bem-vindo ao <span className="gradient-text italic">StudyHub</span>
          </motion.h1>
          <motion.p variants={staggerItem} className="text-muted text-sm font-medium px-4">
            Prepare-se para o sucesso! Configure seu perfil para começarmos sua jornada rumo à aprovação.
          </motion.p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Nome de Exibição */}
          <motion.div variants={staggerItem} className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted ml-1 flex items-center gap-2">
              Como gostaria de ser Chamado(a)?
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Seu nome ou apelido..."
              required
              className="w-full px-5 py-3.5 rounded-2xl bg-secondary border border-default text-primary placeholder:text-muted outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-bold"
            />
          </motion.div>

          <motion.div variants={staggerItem} className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted ml-1 flex items-center gap-2">
              <Target className="w-3 h-3" /> Selecione seu Edital para começar
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
            disabled={loading || !selectedConcursoId || !displayName.trim()}
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
      </motion.div>
    </div>
  );
}
