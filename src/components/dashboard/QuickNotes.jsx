import { useState, useEffect, useRef } from 'react';
import { StickyNote, Save, Loader2, AlertTriangle, CloudCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function QuickNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [initialNotes, setInitialNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  
  // Ref para persistir o valor atual e garantir o save no unmount
  const notesRef = useRef('');

  // Sincronizar ref com o estado
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // 1. Carregar notas iniciais com tratamento de erro robusto
  useEffect(() => {
    async function loadNotes() {
      if (!user) return;
      try {
        setLoadError(false);
        // Usamos .limit(1) para evitar Erro 406 caso existam múltiplas linhas
        const { data, error } = await supabase
          .from('user_notes')
          .select('content, updated_at')
          .eq('user_id', user.id)
          .limit(1);
        
        if (error) throw error;

        if (data && data.length > 0) {
          const content = data[0].content || '';
          setNotes(content);
          setInitialNotes(content);
          notesRef.current = content;
          setLastSaved(new Date(data[0].updated_at));
        } else {
          // Usuário novo ou sem notas
          setInitialNotes('');
        }
        setIsLoaded(true);
      } catch (err) {
        console.error('Erro crítico ao carregar notas:', err);
        setLoadError(true);
      }
    }
    loadNotes();
  }, [user]);

  // 2. Função central de salvamento com travas de segurança
  const handleSave = async (content) => {
    if (!user || !isLoaded || loadError) return;
    
    // Só salva se o conteúdo for realmente diferente do que foi carregado/salvo por último
    if (content === initialNotes && lastSaved) return;

    setSaving(true);
    setSaveError(false);
    
    try {
      const { error } = await supabase
        .from('user_notes')
        .upsert({ 
          user_id: user.id, 
          content: content,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;

      setLastSaved(new Date());
      setInitialNotes(content); // Atualiza base de comparação
    } catch (err) {
      console.error('Erro ao salvar notas:', err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  // 3. Auto-save (Debounce)
  useEffect(() => {
    if (!isLoaded || loadError) return;

    const timeout = setTimeout(() => {
      // Evita salvar se for o valor inicial exato (prevenção extra contra race conditions)
      if (notes !== initialNotes) {
        handleSave(notes);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [notes, isLoaded, loadError]);

  // 4. Save on Unmount (Final Guard)
  useEffect(() => {
    return () => {
      // Salva apenas se houver mudanças pendentes e o sistema estiver em estado estável
      if (isLoaded && !loadError && notesRef.current !== initialNotes) {
        const userId = user?.id;
        const finalContent = notesRef.current;
        if (userId) {
          // Fire-and-forget save no encerramento do componente
          supabase.from('user_notes').upsert({ 
            user_id: userId, 
            content: finalContent,
            updated_at: new Date().toISOString()
          }).then();
        }
      }
    };
  }, [isLoaded, loadError, user?.id]); // Note: initialNotes is intentionally omitted here to catch the latest change

  return (
    <div className={`glass-card flex flex-col h-full transition-colors group ${
      loadError ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/10'
    }`}>
      <div className="p-4 border-b border-default flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-500">
          <StickyNote className="w-4 h-4 shadow-yellow-500/20" />
          <span className="text-[10px] font-black uppercase tracking-widest">Anotações</span>
        </div>
        
        <div className="flex items-center gap-2">
          {loadError ? (
            <div className="flex items-center gap-1.5 text-red-500 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Erro de Conexão</span>
            </div>
          ) : saving ? (
            <div className="flex items-center gap-1.5 text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[8px] font-bold uppercase">Sincronizando...</span>
            </div>
          ) : saveError ? (
            <div className="flex items-center gap-1.5 text-orange-500">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-[8px] font-bold uppercase">Erro ao Salvar</span>
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-1.5 text-success/70">
              <CloudCheck className="w-3 h-3" />
              <span className="text-[8px] font-bold uppercase tracking-wider">
                Salvo {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      
      <div className="flex-1 p-4 relative">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loadError || !isLoaded}
          placeholder={loadError ? "Não foi possível carregar suas notas." : "Lembretes, fórmulas, metas do dia..."}
          className="w-full h-full bg-transparent border-none outline-none text-sm text-primary/90 placeholder:text-muted/50 resize-none leading-relaxed font-medium disabled:opacity-50"
        />
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
           <Save className="w-3 h-3 text-muted" />
        </div>
      </div>
    </div>
  );
}
