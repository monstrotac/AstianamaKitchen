import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layouts
import SanctumLayout from './components/sanctum/SanctumLayout';
import GardenLayout from './components/layout/GardenLayout';

// Pages — shared
import LoginPage from './pages/LoginPage';

// Pages — Sanctum
import SpireHomePage       from './pages/sanctum/SpireHomePage';
import SpireCharactersPage from './pages/sanctum/SpireCharactersPage';
import SpireCharacterPage  from './pages/sanctum/SpireCharacterPage';
import SpireTrialsPage     from './pages/sanctum/SpireTrialsPage';
import SpireTrialPage      from './pages/sanctum/SpireTrialPage';
import SpireProfilePage    from './pages/sanctum/SpireProfilePage';
import SpireAdminPage     from './pages/sanctum/SpireAdminPage';
import SpireReportsPage   from './pages/sanctum/SpireReportsPage';
import SpireStoriesPage   from './pages/sanctum/SpireStoriesPage';
import ReportEditPage     from './pages/sanctum/ReportEditPage';
import ReportViewPage     from './pages/sanctum/ReportViewPage';
import TrialEditPage      from './pages/sanctum/TrialEditPage';
import StoryEditPage      from './pages/sanctum/StoryEditPage';
import StoryViewPage      from './pages/sanctum/StoryViewPage';

// Pages — Garden
import DashboardPage from './pages/DashboardPage';
import SessionsPage from './pages/SessionsPage';

import { SanctumProvider } from './contexts/SanctumContext';
import { useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const { isAuthenticated, ready } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.startsWith('/garden')) {
      document.documentElement.setAttribute('data-theme', 'sanctum');
    }
  }, [location.pathname]);

  if (!ready) return null;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* ── The Sanctum (public) ──────────────────────────────────────── */}
      <Route element={<SanctumLayout />}>
        <Route index                       element={<SpireHomePage />} />
        <Route path="characters"           element={<SpireCharactersPage />} />
        <Route path="characters/:charId"    element={<SpireCharacterPage />} />
        <Route path="trials"               element={<SpireTrialsPage />} />
        <Route path="trials/:id"           element={<SpireTrialPage />} />
        <Route path="profile"              element={
          <ProtectedRoute><SpireProfilePage /></ProtectedRoute>
        } />
        <Route path="reports"               element={<SpireReportsPage />} />
        <Route path="reports/:id"           element={<ReportViewPage />} />
        <Route path="reports/:id/edit"      element={<ProtectedRoute><ReportEditPage /></ProtectedRoute>} />
        <Route path="stories"               element={<SpireStoriesPage />} />
        <Route path="trials/:id/edit"       element={<ProtectedRoute><TrialEditPage /></ProtectedRoute>} />
        <Route path="characters/:charId/stories/:storyId" element={<StoryViewPage />} />
        <Route path="characters/:charId/stories/:storyId/edit" element={<ProtectedRoute><StoryEditPage /></ProtectedRoute>} />
        <Route path="sessions" element={
          <ProtectedRoute><SessionsPage /></ProtectedRoute>
        } />
        <Route path="admin" element={
          <ProtectedRoute><SpireAdminPage /></ProtectedRoute>
        } />
      </Route>

      {/* ── The Garden (protected) ────────────────────────────────────── */}
      <Route path="/garden/*" element={
        <ProtectedRoute>
          <GardenLayout />
        </ProtectedRoute>
      }>
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SanctumProvider>
            <AppRoutes />
          </SanctumProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
