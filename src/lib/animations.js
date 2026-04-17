/**
 * Variantes reutilizáveis do Framer Motion para o StudyHub
 */

// ── Padrão Global (Fluid/Premium) ──
// Agora todas as páginas herdam o comportamento "Pure & Smooth"

export const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: { duration: 0.3, ease: [0, 0.55, 0.45, 1] } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.2 } 
  }
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.01 }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.45, 
      ease: [0, 0.55, 0.45, 1] 
    } 
  }
};

// Aliases para compatibilidade (mantendo suporte aos nomes antigos se necessário)
export const fluidPageVariants = pageVariants;
export const fluidStaggerContainer = staggerContainer;
export const fluidStaggerItem = staggerItem;

// ── Outras Variantes ──

export const scaleIn = {
  initial: { opacity: 0, scale: 0.98, y: 4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0, 0.55, 0.45, 1] }
  }
};

export const expandDown = {
  initial: { opacity: 0, height: 0, y: -4 },
  animate: {
    opacity: 1,
    height: 'auto',
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2 }
  }
};
