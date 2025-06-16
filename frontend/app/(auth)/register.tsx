// Register screen
// Handles user registration with email, password, and optional name

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User } from 'lucide-react-native';

import { useAuth } from '@/lib/auth-context';
import { registerSchema, RegisterInput } from '@/lib/api';
import { FormInput, PasswordInput } from '@/components/ui/FormInput';
import { LoadingButton } from '@/components/ui/Loading';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsSubmitting(true);
    try {
      await register(data);
      router.replace('/(onboarding)/welcome');
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'An error occurred during registration'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join us on your personal growth journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, value } }) => (
                    <FormInput
                      label="First Name"
                      placeholder="John"
                      value={value}
                      onChangeText={onChange}
                      error={errors.firstName?.message}
                      autoCapitalize="words"
                      autoComplete="given-name"
                      leftIcon={<User size={20} color="#6B7280" />}
                    />
                  )}
                />
              </View>

              <View style={styles.nameField}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, value } }) => (
                    <FormInput
                      label="Last Name"
                      placeholder="Doe"
                      value={value}
                      onChangeText={onChange}
                      error={errors.lastName?.message}
                      autoCapitalize="words"
                      autoComplete="family-name"
                      leftIcon={<User size={20} color="#6B7280" />}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Email"
                  placeholder="john@example.com"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<Mail size={20} color="#6B7280" />}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <PasswordInput
                  label="Password"
                  placeholder="Create a strong password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  helperText="Must be at least 8 characters long"
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  required
                />
              )}
            />

            <LoadingButton
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Create Account
            </LoadingButton>
          </View>

          {/* Terms and conditions */}
          <Text style={styles.terms}>
            By creating an account, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>

          {/* Sign in link */}
          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.signinLink}>Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  terms: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  link: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontSize: 16,
    color: '#6B7280',
  },
  signinLink: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});
