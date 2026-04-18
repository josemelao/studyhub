import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Palette, AlertTriangle, Save, Loader2, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'theme', label: 'Tema', icon: Palette },
  { id: 'data', label: 'Dados', icon: AlertTriangle },
];

const THEMES = [
  { id: 'luminary', name: 'Luminary', color: '#7c5cfc' },
  { id: 'abyssal', name: 'Abyssal', color: '#10b981' },
  { id: 'dracula', name: 'Dracula', color: '#ff79c6' },
  { id: 'nord', name: 'Nord', color: '#88c0d0' },
  { id: 'coffee', name: 'Coffee', color: '#d2b48c' },
  { id: 'oceanic', name: 'Oceanic', color: '#0ea5e9' }
];

export default function SettingsPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const { currentWorkspaceId, workspaces } = useWorkspace();
  const currentWorkspaceName = workspaces?.find(w => w.id === currentWorkspaceId)?.name;

  const [activeTab, setActiveTab] = useState('profile');

  // Perfil State
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Segurança State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Tema State
  const [currentTheme, setCurrentTheme] = useState('luminary');

  // Danger Zone State
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Load initial profile data
  useEffect(() => {
    if (user && isOpen) {
      const loadProfile = async () => {
        const { data } = await supabase.from('profiles').select('display_name, bio').eq('id', user.id).single();
        if (data) {
          setDisplayName(data.display_name || '');
          setBio(data.bio || '');
        }
        const savedTheme = localStorage.getItem(`studyhub_theme_${user.id}`) || 'luminary';
        setCurrentTheme(savedTheme);
      };
      loadProfile();
    }
  }, [user, isOpen]);

  // Handlers
  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      // O .select().single() força o Supabase a tentar retornar a linha alterada. 
      // Se o RLS barrar, ele agora dará um erro real em vez de falhar em silêncio.
      const { data, error } = await supabase.from('profiles').update({
        display_name: displayName,
        bio: bio,
        updated_at: new Date().toISOString()
      }).eq('id', user.id).select().single();
      
      if (error) throw error;
      toast.success('Perfil atualizado!');
    } catch (err) {
      toast.error('Erro de Permissão: ' + (err.message || 'Falha ao salvar.'));
      console.error("Erro no Salvador de Perfil:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      return toast.error('As senhas não coincidem.');
    }
    if (newPassword.length < 6) {
      return toast.error('A senha deve ter pelo menos 6 caracteres.');
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha atualizada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Erro ao atualizar senha.');
      console.error(err);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeTheme = (themeId) => {
    setCurrentTheme(themeId);
    document.body.setAttribute('data-theme', themeId);
    localStorage.setItem(`studyhub_theme_${user?.id}`, themeId);
  };

  const handleResetData = async () => {
    if (resetConfirmation !== currentWorkspaceName) {
      return toast.error('Nome do espaço de estudo incorreto.');
    }
    setResetConfirmation(''); // Reseta o input visualmente 
    
    // Mostra um toast condicional com promise para UX Premium
    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          // Precisamos fazer as deleções em cadeia das tabelas de histórico
          const { error: e1 } = await supabase.from('exam_sessions')
            .delete().eq('workspace_id', currentWorkspaceId).eq('user_id', user.id);
          if (e1) throw e1;

          const { error: e2 } = await supabase.from('user_answers')
            .delete().eq('workspace_id', currentWorkspaceId).eq('user_id', user.id);
          if (e2) throw e2;

          const { error: e3 } = await supabase.from('quiz_sessions')
            .delete().eq('workspace_id', currentWorkspaceId).eq('user_id', user.id);
          if (e3) throw e3;

          // E resetar as contagens no workspace_stats
          const { error: e4 } = await supabase.from('workspace_stats')
            .update({ total_questoes_respondidas: 0, total_acertos: 0 })
            .eq('workspace_id', currentWorkspaceId).eq('user_id', user.id);
          if (e4) throw e4;

          resolve();
        } catch (err) {
          reject(err);
        }
      }),
      {
        loading: 'Apagando histórico do edital...',
        success: 'Treino resetado! Você pode recomeçar.',
        error: 'Erro ao resetar. Tente novamente.'
      }
    );
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-[150]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-secondary border-l border-default shadow-2xl z-[160] flex flex-col overflow-hidden"
          >
            {/* ...rest of the code... */}
            {/* Header */}
            <div className="p-6 border-b border-default flex items-center justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-black text-primary tracking-tight">Configurações</h2>
                <p className="text-xs text-muted font-medium mt-1">Gerencie sua conta e experiência</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-4 py-3 border-b border-default gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === tab.id 
                      ? 'bg-accent/10 text-accent border border-accent/20' 
                      : 'text-muted hover:text-primary hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* TAB: PERFIL */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-accent flex items-center justify-center border-2 border-white/10 shadow-glow-accent shrink-0">
                      <span className="text-3xl font-black text-white">{displayName.charAt(0).toUpperCase() || 'U'}</span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-primary truncate">{user?.email}</p>
                      <p className="text-xs text-muted uppercase tracking-widest font-black mt-1">Plano Free</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 text-muted">Nome de Exibição</label>
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-primary border border-default text-primary text-sm focus:border-accent outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 text-muted">Apresentação Crachá</label>
                      <input 
                        type="text" 
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Ex: Focado no Bacen 2024"
                        className="w-full px-4 py-3 rounded-xl bg-primary border border-default text-primary text-sm focus:border-accent outline-none transition-colors"
                      />
                    </div>
                    
                    <button 
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-primary font-bold text-sm hover:bg-white/15 transition-all mt-4 border border-white/5"
                    >
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: SEGURANÇA */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-primary mb-1">Trocar Senha</h3>
                    <p className="text-xs text-muted mb-6">Mantenha sua conta segura atualizando sua senha.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 text-muted">Nova Senha</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-primary border border-default text-primary text-sm focus:border-accent outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 text-muted">Confirmar Senha</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-primary border border-default text-primary text-sm focus:border-accent outline-none transition-colors"
                        />
                      </div>
                      
                      <button 
                        onClick={handleSavePassword}
                        disabled={savingPassword || (!newPassword && !confirmPassword)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-accent text-white font-bold text-sm hover:opacity-90 transition-all mt-4 shadow-glow-accent disabled:opacity-50"
                      >
                        {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        Atualizar Senha
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: TEMAS */}
              {activeTab === 'theme' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-primary mb-1">Personalização Visual</h3>
                  <p className="text-xs text-muted mb-6">Escolha a cor de destaque principal do StudyHub.</p>

                  <div className="grid grid-cols-2 gap-3">
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => handleChangeTheme(theme.id)}
                        className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                          currentTheme === theme.id 
                            ? 'border-accent bg-accent/5' 
                            : 'border-default bg-primary hover:border-white/20'
                        }`}
                      >
                        <div 
                          className="w-5 h-5 shrink-0 rounded-full shadow-lg" 
                          style={{ backgroundColor: theme.color }}
                        />
                        <span className="text-sm font-bold text-primary">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: DADOS (ZONA DE PERIGO) */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-error/10 border border-error/20">
                    <h3 className="text-sm font-black tracking-tight text-error flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Zona de Perigo
                    </h3>
                    <p className="text-xs font-semibold text-error/80 leading-relaxed mb-6">
                      Apagar o histórico é uma ação IRREVERSÍVEL. Suas sessões de simulado e cadernos de questões deste edital sumirão. XP e Nível global continuam intactos.
                    </p>

                    <div className="bg-primary/50 p-4 rounded-xl border border-error/10">
                      <p className="text-xs font-bold text-muted mb-3">Para prosseguir, digite o nome do seu edital: <span className="text-primary italic">"{currentWorkspaceName}"</span></p>
                      <input 
                        type="text" 
                        value={resetConfirmation}
                        onChange={e => setResetConfirmation(e.target.value)}
                        placeholder="Nome exato do edital"
                        className="w-full px-4 py-3 rounded-lg bg-primary border border-error/30 text-primary text-sm focus:border-error focus:ring-1 focus:ring-error transition-all outline-none mb-4 font-bold"
                      />
                      
                      <button 
                        onClick={handleResetData}
                        disabled={resetConfirmation !== currentWorkspaceName}
                        className="w-full py-3 rounded-lg bg-error text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Resetar Progresso Neste Edital
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
