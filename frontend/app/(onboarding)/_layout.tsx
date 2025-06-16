// Onboarding layout
// Handles navigation between onboarding screens

import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { Loading } from '@/components/ui/Loading';
import { preferencesStorageUtils } from '@/lib/storage';

export default function OnboardingLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Check if onboarding is already completed
  if (preferencesStorageUtils.isOnboardingCompleted()) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="context-setup" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}
