import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { pageVariants, staggerItem, staggerContainer } from '../lib/animations';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState('login'); // login | register | forgot_password
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
      } else if (mode === 'register') {
        const { error, data } = await signUp(email, password);
        if (error) throw error;
        
        if (!data?.session) {
          setSuccess('✅ Conta criada! Mas atenção: enviamos um link de confirmação para o seu e-mail. Você precisa clicar lá para validar sua conta antes de entrar.');
        } else {
          setSuccess('✅ Conta criada com sucesso! Você já pode entrar.');
        }
        setMode('login');
      } else if (mode === 'forgot_password') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccess('✅ Link enviado! Verifique sua caixa de entrada (e o spam) para redefinir sua senha.');
      }
    } catch (err) {
      const errorMap = {
        'Invalid login credentials': 'E-mail ou senha incorretos. Verifique seus dados.',
        'Email not confirmed': '⚠️ Seu e-mail ainda não foi validado. Por favor, clique no link que enviamos para sua caixa de entrada.',
        'User not found': 'Não encontramos nenhuma conta com este e-mail.',
        'User already registered': 'Este e-mail já está sendo usado por outra conta.',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
        'Too many attempts': 'Muitas tentativas. Por segurança, tente novamente em alguns minutos.',
        'rate limit exceeded': 'Limite de envios atingido. Por segurança, tente novamente em uma hora.',
      };

      let friendlyMessage = err.message;
      const matchingKey = Object.keys(errorMap).find(key => 
        err.message?.toLowerCase().includes(key.toLowerCase())
      );

      if (matchingKey) friendlyMessage = errorMap[matchingKey];
      setError(friendlyMessage);
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
              className="w-16 h-16 rounded-3xl overflow-hidden mb-5 shadow-glow-accent glow-accent border border-white/10"
            >
              <img src="/favicon.png" alt="StudyHub Logo" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-4xl font-black mb-2 gradient-text tracking-tighter italic pr-2">StudyHub AI</h1>
            <p className="text-sm font-bold text-muted uppercase tracking-widest text-center">
              {mode === 'login' ? 'Inteligência para sua Aprovação' : 
               mode === 'register' ? 'Junte-se a milhares de concurseiros' : 
               'Recuperar Acesso ao Hub'}
            </p>
          </motion.div>

          {/* Card */}
          <motion.div variants={staggerItem} className="glass-card p-8 md:p-10 shadow-2xl bg-white/[0.01]">
            {/* Tabs */}
            <div className="flex rounded-2xl p-1.5 mb-8 bg-secondary border border-default">
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    (mode === m || (mode === 'forgot_password' && m === 'login'))
                      ? 'bg-gradient-accent text-white shadow-lg'
                      : 'text-muted hover:text-secondary hover:bg-white/[0.03]'
                  }`}
                >
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form 
                key={mode}
                onSubmit={handleSubmit} 
                className="space-y-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Email */}
                <div>
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
                </div>

                {/* Password (only for login/register) */}
                {mode !== 'forgot_password' && (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted">Senha</label>
                      {mode === 'login' && (
                        <button 
                          type="button"
                          onClick={() => { setMode('forgot_password'); setError(''); setSuccess(''); }}
                          className="text-[10px] font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-widest"
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
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
                )}

                {/* Feedback Error/Success */}
                <AnimatePresence mode="wait">
                  {(error || success) && (
                    <motion.div
                      key={error ? 'err' : 'succ'}
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
                <div className="space-y-3 pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 bg-gradient-accent text-white shadow-glow-accent hover:opacity-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {mode === 'login' ? 'Entrar no Hub' : mode === 'register' ? 'Criar Minha Conta' : 'Enviar Link de Recuperação'}
                  </motion.button>

                  {mode === 'forgot_password' && (
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                      className="w-full text-center text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors"
                    >
                      Voltar para o Login
                    </button>
                  )}
                </div>
              </motion.form>
            </AnimatePresence>
          </motion.div>

          <motion.p variants={staggerItem} className="text-center text-[10px] font-bold uppercase tracking-[0.2em] mt-8 text-muted opacity-50 text-wrap px-4">
            Transforme seu estudo em resultados reais.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
