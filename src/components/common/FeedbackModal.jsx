import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bug, Lightbulb, HelpCircle, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const TYPES = [
  {
    id: 'bug',
    label: 'Reportar Problema',
    icon: Bug,
    description: 'Algo não está funcionando como esperado.',
    color: 'var(--error)',
    bg: 'rgba(var(--error-rgb), 0.08)',
    border: 'rgba(var(--error-rgb), 0.25)',
  },
  {
    id: 'suggestion',
    label: 'Sugestão',
    icon: Lightbulb,
    description: 'Tenho uma ideia para melhorar o StudyHub.',
    color: 'var(--warning)',
    bg: 'rgba(var(--warning-rgb), 0.08)',
    border: 'rgba(var(--warning-rgb), 0.25)',
  },
  {
    id: 'help',
    label: 'Preciso de Ajuda',
    icon: HelpCircle,
    description: 'Tenho uma dúvida sobre como usar o app.',
    color: 'var(--accent)',
    bg: 'var(--accent-subtle)',
    border: 'var(--accent-border)',
  },
];

export default function FeedbackModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('bug');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorText, setErrorText] = useState('');
  const backdropRef = useRef(null);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedType('bug');
      setMessage('');
      setStatus('idle');
      setErrorText('');
    }
  }, [isOpen]);

  // Fechar com Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorText('Por favor, escreva sua mensagem antes de enviar.');
      return;
    }

    setStatus('loading');
    setErrorText('');

    const { error } = await supabase.from('feedbacks').insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      type: selectedType,
      message: message.trim(),
    });

    if (error) {
      setStatus('error');
      setErrorText('Ocorreu um erro ao enviar. Tente novamente.');
      console.error('Feedback error:', error);
    } else {
      setStatus('success');
    }
  };

  const selectedTypeData = TYPES.find((t) => t.id === selectedType);

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={backdropRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ duration: 0.25, ease: [0.34, 1.1, 0.64, 1] }}
            className="w-full max-w-md relative overflow-hidden rounded-2xl border border-default"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-default">
              <div>
                <h2 className="text-lg font-bold text-primary">Ajuda & Feedback</h2>
                <p className="text-xs text-muted mt-0.5">Sua opinião nos ajuda a melhorar.</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-muted hover:text-primary hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(var(--success-rgb), 0.12)', border: '1px solid rgba(var(--success-rgb), 0.25)' }}
                  >
                    <CheckCircle className="w-8 h-8" style={{ color: 'var(--success)' }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary mb-1">Enviado com Sucesso!</h3>
                    <p className="text-sm text-muted">Obrigado pelo feedback. Vou analisar e retornar em breve.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: 'var(--gradient-accent)' }}
                  >
                    Fechar
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="p-6 flex flex-col gap-5"
                >
                  {/* Type selector */}
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Tipo</p>
                    <div className="flex flex-col gap-2">
                      {TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedType === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setSelectedType(type.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                            style={{
                              background: isSelected ? type.bg : 'transparent',
                              border: `1px solid ${isSelected ? type.border : 'var(--border)'}`,
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background: isSelected ? type.bg : 'rgba(255,255,255,0.04)',
                              }}
                            >
                              <Icon className="w-4 h-4" style={{ color: isSelected ? type.color : 'var(--text-muted)' }} />
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: isSelected ? type.color : 'var(--text-primary)' }}>
                                {type.label}
                              </p>
                              <p className="text-[10px] text-muted leading-tight">{type.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Mensagem</p>
                    <textarea
                      value={message}
                      onChange={(e) => { setMessage(e.target.value); setErrorText(''); }}
                      placeholder={
                        selectedType === 'bug'
                          ? 'Descreva o problema que encontrou...'
                          : selectedType === 'suggestion'
                          ? 'Qual melhoria você sugere?'
                          : 'O que você precisa de ajuda?'
                      }
                      rows={4}
                      className="w-full bg-white/5 border border-default rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted resize-none focus:outline-none transition-all"
                      style={{ borderColor: message.trim() ? 'var(--border-hover)' : undefined }}
                    />
                    {errorText && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-3.5 h-3.5 text-error flex-shrink-0" />
                        <p className="text-xs text-error">{errorText}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-muted hover:text-primary bg-white/5 border border-default hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                      style={{ background: selectedTypeData?.color ?? 'var(--accent)' }}
                    >
                      {status === 'loading' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
