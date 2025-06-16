// Auth layout
// Handles navigation between authentication screens

import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { Loading } from '@/components/ui/Loading';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  // Redirect to tabs if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
