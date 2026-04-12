import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DecksPage from './pages/DecksPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import DeckDetailPage from './pages/DeckDetailPage';
import StudyPage    from './pages/StudyPage';
import AppLayout    from './components/layout/AppLayout';

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected — wrapped in sidebar layout */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="decks" element={<DecksPage />} />
        <Route path="stats" element={<ProgressPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="deck/:deckId" element={<DeckDetailPage />} />
      </Route>

      {/* Study mode — full screen, no sidebar */}
      <Route path="/study/:deckId" element={
        <ProtectedRoute><StudyPage /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
