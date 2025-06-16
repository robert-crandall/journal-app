// Index screen - redirects to appropriate flow
// Determines where to send users based on their authentication and onboarding status

import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { preferencesStorageUtils } from '@/lib/storage';
import { Loading } from '@/components/ui/Loading';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  // Not authenticated - go to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated but onboarding not completed - go to onboarding
  if (!preferencesStorageUtils.isOnboardingCompleted()) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Authenticated and onboarding completed - go to main app
  return <Redirect href="/(tabs)" />;
}
