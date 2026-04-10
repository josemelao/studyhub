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

// Componente helper para o AnimatePresence funcionar com React Router
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Rota pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas envelopadas pelo PageWrapper */}
        <Route element={<ProtectedRoute><PageWrapper /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/materias" element={<MateriasPage />} />
          <Route path="/materia/:id" element={<SubjectPage />} />
          <Route path="/estudo/:id" element={<StudyPage />} />
          <Route path="/questoes" element={<QuestoesPage />} />
          <Route path="/progresso" element={<ProgressPage />} />
        </Route>

        {/* Fallback */}
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
          <AnimatedRoutes />
        </BrowserRouter>
      </SubjectsProvider>
    </AuthProvider>
  );
}

export default App;
