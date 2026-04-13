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
import AchievementToast from './components/ui/AchievementToast';

function AppContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <DashboardPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/materias"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <MateriasPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/materia/:id"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <SubjectPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/estudo/:id"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <StudyPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/progresso"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <ProgressPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/questoes"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <QuestoesPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        {/* Novas rotas Modo Prova */}
        <Route
          path="/modo-prova"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <ExamConfigPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/modo-prova/sessao/:id"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <ExamSessionPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/modo-prova/resultado/:id"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <ExamResultPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/favoritos"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <FavoritesPage />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
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
