import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

// Contexts & Layouts
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { SubjectsProvider } from './contexts/SubjectsContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PageWrapper from './components/layout/PageWrapper';

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
import OnboardingPage from './pages/OnboardingPage';
import { Toaster } from 'react-hot-toast';

/**
 * Componente que gerencia apenas as rotas que precisam do Sidebar/Navbar persistente.
 * O AnimatePresence aqui garante que apenas o CONTEÚDO da página mude, 
 * enquanto o PageWrapper (Sidebar) permanece montado.
 */
function AuthenticatedApp() {
  const location = useLocation();
  const { currentWorkspaceId, loadingWorkspace } = useWorkspace();

  // Tela de loading Global enquanto o Workspace inicializa
  if (loadingWorkspace) {
    return (
      <div className="h-screen w-full bg-primary flex flex-col items-center justify-center gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow-accent"
        >
          <Trophy className="w-6 h-6 text-white" />
        </motion.div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent animate-pulse">StudyHub</p>
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
            <Route path="/gerenciar-conteudo" element={<ContentAdminPage />} />
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
