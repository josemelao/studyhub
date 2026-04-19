import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import { useEffect, useLayoutEffect } from 'react';

// Contexts & Layouts
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { SubjectsProvider } from './contexts/SubjectsContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PageWrapper from './components/layout/PageWrapper';
import { useIsAdmin } from './hooks/useIsAdmin';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SubjectPage from './pages/SubjectPage';
import StudyPage from './pages/StudyPage';
import ProgressPage from './pages/ProgressPage';
import MateriasPage from './pages/MateriasPage';
import QuestoesPage from './pages/QuestoesPage';
import ExamConfigPage from './pages/ExamConfigPage';
import ExamSessionPage from './pages/ExamSessionPage';
import ExamResultPage from './pages/ExamResultPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import AchievementToast from './components/ui/AchievementToast';
import PlannerPage from './pages/PlannerPage';
import ContentAdminPage from './pages/ContentAdminPage';
import FeedbackInboxPage from './pages/FeedbackInboxPage';
import OnboardingPage from './pages/OnboardingPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import { Toaster } from 'react-hot-toast';

import { useAuth } from './hooks/useAuth';

/**
 * Componente que gerencia apenas as rotas que precisam do Sidebar/Navbar persistente.
 * O AnimatePresence aqui garante que apenas o CONTEÚDO da página mude, 
 * enquanto o PageWrapper (Sidebar) permanece montado.
 */
function AuthenticatedApp() {
  const location = useLocation();
  const { currentWorkspaceId, loadingWorkspace } = useWorkspace();
  const isAdmin = useIsAdmin();
  const { user } = useAuth();

  // Garante que o tema padrão seja aplicado globalmente e isolado por usuário sem flicker
  useLayoutEffect(() => {
    if (user) {
      const savedTheme = localStorage.getItem(`studyhub_theme_${user.id}`) || 'luminary';
      document.body.setAttribute('data-theme', savedTheme);
    } else {
      document.body.setAttribute('data-theme', 'luminary');
    }
  }, [user]);

  // Tela de loading Global enquanto o Workspace inicializa
  if (loadingWorkspace) {
    return (
      <div className="h-screen w-full bg-primary flex flex-col items-center justify-center gap-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative"
        >
          {/* Outer Ring Animation */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 -m-4 rounded-full border border-dashed border-accent/20"
          />
          
          <div className="w-16 h-16 rounded-3xl bg-gradient-accent flex items-center justify-center shadow-glow-accent relative z-10 border border-white/10">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-2 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent animate-pulse">StudyHub AI</p>
          <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-r from-transparent via-accent to-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  // Se houver workspace e estivermos no onboarding, volta pro dashboard
  if (currentWorkspaceId && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redireciona para onboarding se realmente não houver nada após o loading
  if (!loadingWorkspace && !currentWorkspaceId && location.pathname !== '/onboarding') {
     return <Navigate to="/onboarding" replace />;
  }

  return (
    <ProtectedRoute>
      <PageWrapper>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/materias" element={<MateriasPage />} />
            <Route path="/planejador" element={<PlannerPage />} />
            <Route path="/materia/:id" element={<SubjectPage />} />
            <Route path="/estudo/:id" element={<StudyPage />} />
            <Route path="/progresso" element={<ProgressPage />} />
            <Route path="/questoes" element={<QuestoesPage />} />
            <Route path="/modo-prova" element={<ExamConfigPage />} />
            <Route path="/modo-prova/sessao/:id" element={<ExamSessionPage />} />
            <Route path="/modo-prova/resultado/:id" element={<ExamResultPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/historico" element={<HistoryPage />} />
            <Route path="/gerenciar-conteudo" element={isAdmin ? <ContentAdminPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/feedback-inbox" element={isAdmin ? <FeedbackInboxPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            
            {/* Redirecionamentos internos se necessário */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </PageWrapper>
    </ProtectedRoute>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <Routes location={location}>
      {/* Rota de Login: Independente e sem Sidebar */}
      <Route path="/login" element={
        <AnimatePresence mode="wait">
          <LoginPage />
        </AnimatePresence>
      } />

      <Route path="/update-password" element={
        <AnimatePresence mode="wait">
          <UpdatePasswordPage />
        </AnimatePresence>
      } />

      {/* Todas as outras rotas: Usam o layout persistente */}
      <Route path="/*" element={<AuthenticatedApp />} />
    </Routes>
  );
}


function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <SubjectsProvider>
          <BrowserRouter>
            <AppContent />
            <AchievementToast />
            <Toaster 
              position="top-center"
              toastOptions={{
                className: '',
                style: {
                  background: 'rgba(12, 13, 22, 0.8)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(124, 92, 252, 0.2)',
                  color: '#f0eff4',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '700',
                  padding: '12px 20px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                },
                success: {
                  iconTheme: {
                    primary: '#34d399',
                    secondary: '#0c0d16',
                  },
                  style: {
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#fb7185',
                    secondary: '#0c0d16',
                  },
                  style: {
                    border: '1px solid rgba(251, 113, 133, 0.3)',
                  }
                }
              }}
            />
          </BrowserRouter>
        </SubjectsProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
