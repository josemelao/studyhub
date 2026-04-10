/**
 * Variantes reutilizáveis do Framer Motion para o StudyHub
 */

export const pageVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  },
  exit: { 
    opacity: 0, 
    y: -12, 
    filter: 'blur(4px)',
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
  },
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
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
