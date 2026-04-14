import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Contexts & Layouts
import { AuthProvider } from './contexts/AuthContext';
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

/**
 * Componente que gerencia apenas as rotas que precisam do Sidebar/Navbar persistente.
 * O AnimatePresence aqui garante que apenas o CONTEÚDO da página mude, 
 * enquanto o PageWrapper (Sidebar) permanece montado.
 */
function AuthenticatedApp() {
  const location = useLocation();

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
      <SubjectsProvider>
        <BrowserRouter>
          <AppContent />
          <AchievementToast />
        </BrowserRouter>
      </SubjectsProvider>
    </AuthProvider>
  );
}

export default App;
