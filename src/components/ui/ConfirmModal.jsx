import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

/**
 * Componente de Modal de Confirmação Premium
 * 
 * @param {boolean} isOpen - Controla a visibilidade
 * @param {function} onClose - Função ao cancelar/fechar
 * @param {function} onConfirm - Função ao confirmar
 * @param {string} title - Título do modal
 * @param {string} message - Corpo do texto
 * @param {string} confirmText - Texto do botão de ação
 * @param {string} cancelText - Texto do botão de cancelar
 * @param {boolean} loading - Estado de carregamento do botão de ação
 */
export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Tem certeza?", 
  message = "Esta ação não poderá ser desfeita.",
  confirmText = "Excluir",
  cancelText = "Cancelar",
  loading = false 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-primary/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-card border-accent/20 bg-secondary/90 shadow-2xl pointer-events-auto overflow-hidden"
            >
              {/* Header com Ícone de Alerta */}
              <div className="p-6 pb-0 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-4 ring-8 ring-error/5">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2 tracking-tight">
                  {title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="p-6 flex gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-default text-primary text-xs font-black uppercase tracking-widest hover:bg-white/[0.05] transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-error text-white text-xs font-black uppercase tracking-widest hover:bg-error-hover shadow-lg shadow-error/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    confirmText
                  )}
                </button>
              </div>

              {/* Close Button X (Optional) */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-muted hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
