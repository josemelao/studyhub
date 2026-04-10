import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Gavel } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { pageVariants, scaleIn, staggerItem, staggerContainer } from '../lib/animations';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess('Conta criada! Faça login para continuar.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Algo deu errado. Tente novamente.');
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
        {/* Logo */}
        <motion.div variants={staggerItem} className="flex flex-col items-center mb-12">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5 bg-gradient-accent shadow-glow-accent glow-accent"
          >
            <Zap className="w-8 h-8 text-white fill-current" />
          </motion.div>
          <h1 className="text-4xl font-black mb-2 gradient-text tracking-tighter italic">StudyHub AI</h1>
          <p className="text-sm font-bold text-muted uppercase tracking-widest">
            {mode === 'login' ? 'Inteligência para sua Aprovação' : 'Junte-se a milhares de concurseiros'}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div variants={scaleIn} className="glass-card p-8 md:p-10 shadow-2xl bg-white/[0.01]">
          {/* Tabs */}
          <div className="flex rounded-2xl p-1.5 mb-8 bg-secondary border border-default">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                  mode === m
                    ? 'bg-gradient-accent text-white shadow-lg'
                    : 'text-muted hover:text-secondary hover:bg-white/[0.03]'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <motion.div variants={staggerItem}>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 text-muted">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm bg-secondary border border-default text-primary placeholder:text-muted outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-medium"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={staggerItem}>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 text-muted">Senha</label>
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
            </motion.div>

            {/* Feedback */}
            <AnimatePresence mode="wait">
              {(error || success) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl text-xs font-bold leading-relaxed border ${
                    error
                      ? 'bg-error/10 border-error/20 text-error'
                      : 'bg-success/10 border-success/20 text-success'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error || success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              variants={staggerItem}
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 bg-gradient-accent text-white shadow-glow-accent hover:opacity-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4 shadow-xl"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Entrar no Hub' : 'Criar Minha Conta'}
            </motion.button>
          </form>
        </motion.div>

        <motion.p variants={staggerItem} className="text-center text-[10px] font-bold uppercase tracking-[0.2em] mt-8 text-muted opacity-50">
          Transforme seu estudo em resultados reais.
        </motion.p>
      </motion.div>
    </div>
  );
}
