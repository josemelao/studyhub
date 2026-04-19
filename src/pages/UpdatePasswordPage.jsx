import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { pageVariants, scaleIn, staggerItem, staggerContainer } from '../lib/animations';
import { toast } from 'react-hot-toast';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Senha atualizada com sucesso!');
      
      // Redireciona após 3 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-primary relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-warning/5 blur-[100px]" />
      </div>

      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-sm relative z-10"
      >
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {/* Logo */}
          <motion.div variants={staggerItem} className="flex flex-col items-center mb-12">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="w-16 h-16 rounded-3xl overflow-hidden mb-5 shadow-glow-accent glow-accent"
            >
              <img src="/favicon.png" alt="StudyHub Logo" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-4xl font-black mb-2 gradient-text tracking-tighter italic pr-2">Nova Senha</h1>
            <p className="text-sm font-bold text-muted uppercase tracking-widest text-center">
              Defina sua nova credencial de acesso
            </p>
          </motion.div>

          {/* Card */}
          <motion.div variants={staggerItem} className="glass-card p-8 md:p-10 shadow-2xl bg-white/[0.01]">
            <AnimatePresence mode="wait">
              {!success ? (
                <motion.form 
                  key="form"
                  onSubmit={handleSubmit} 
                  className="space-y-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* New Password */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 text-muted">Nova Senha</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm bg-secondary border border-default text-primary placeholder:text-muted outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 text-muted">Confirmar Senha</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm bg-secondary border border-default text-primary placeholder:text-muted outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Error Feedback */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      className="flex items-start gap-3 p-4 rounded-2xl text-xs font-bold leading-relaxed border bg-error/10 border-error/20 text-error"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 bg-gradient-accent text-white shadow-glow-accent hover:opacity-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4 shadow-xl"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Atualizar Senha
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6 border border-success/20">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h2 className="text-xl font-black text-primary mb-2 italic">Tudo pronto!</h2>
                  <p className="text-sm text-muted font-medium mb-6">
                    Sua senha foi atualizada. Redirecionando você para o dashboard em instantes...
                  </p>
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.p variants={staggerItem} className="text-center text-[10px] font-bold uppercase tracking-[0.2em] mt-8 text-muted opacity-50">
            Sua segurança é nossa prioridade.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
