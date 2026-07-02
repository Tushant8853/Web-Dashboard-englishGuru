import { Navigate } from 'react-router-dom';

/** @deprecated Use /onboarding-intake — goals and questions are on one screen. */
export function OnboardingGoals() {
  return <Navigate to="/onboarding-intake" replace />;
}
