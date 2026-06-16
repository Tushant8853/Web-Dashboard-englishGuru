import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { ChatUiSettings } from '../pages/ChatUiSettings';
import { Dashboard } from '../pages/Dashboard';
import { IntroVideoSettings } from '../pages/IntroVideoSettings';
import { LessonLibrary } from '../pages/LessonLibrary';
import { Login } from '../pages/Login';
import { OnboardingIntake } from '../pages/OnboardingIntake';
import { OnboardingPlacement } from '../pages/OnboardingPlacement';
import { SalesVideoSettings } from '../pages/SalesVideoSettings';

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <DashboardLayout />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/intro-video" element={<IntroVideoSettings />} />
        <Route path="/sales-video" element={<SalesVideoSettings />} />
        <Route path="/chat-ui" element={<ChatUiSettings />} />
        <Route path="/lessons" element={<LessonLibrary />} />
        <Route path="/onboarding-intake" element={<OnboardingIntake />} />
        <Route path="/onboarding-placement" element={<OnboardingPlacement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
