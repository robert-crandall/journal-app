// Forgot password screen
// Handles password reset request

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
import { Mail, ArrowLeft } from 'lucide-react-native';

import { useAuth } from '@/lib/auth-context';
import { passwordResetRequestSchema, PasswordResetRequestInput } from '@/lib/api';
import { FormInput } from '@/components/ui/FormInput';
import { LoadingButton } from '@/components/ui/Loading';

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: PasswordResetRequestInput) => {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(data.email);
      setIsSuccess(true);
    } catch (error) {
      Alert.alert(
        'Request Failed',
        error instanceof Error ? error.message : 'An error occurred while requesting password reset'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (email) {
      setIsSubmitting(true);
      try {
        await requestPasswordReset(email);
        Alert.alert('Email Sent', 'Password reset email has been sent again.');
      } catch (error) {
        Alert.alert(
          'Request Failed',
          error instanceof Error ? error.message : 'An error occurred while resending email'
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Mail size={64} color="#3B82F6" />
            </View>
            
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.email}>{getValues('email')}</Text>
            </Text>
            
            <Text style={styles.instructions}>
              Click the link in the email to reset your password. 
              If you don't see the email, check your spam folder.
            </Text>

            <View style={styles.actionsContainer}>
              <LoadingButton
                loading={isSubmitting}
                onPress={handleResendEmail}
                variant="outline"
                size="lg"
                className="w-full mb-4"
              >
                Resend Email
              </LoadingButton>

              <Link href="/(auth)/login" asChild>
                <button className="btn btn-ghost btn-lg w-full">
                  <ArrowLeft size={20} />
                  Back to Sign In
                </button>
              </Link>
            </View>
          </View>
        </View>
      </View>
    );
  }

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
          {/* Back button */}
          <View style={styles.backContainer}>
            <Link href="/(auth)/login" asChild>
              <button className="btn btn-ghost btn-sm">
                <ArrowLeft size={20} />
                Back
              </button>
            </Link>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Email"
                  placeholder="Enter your email"
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

            <LoadingButton
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Send Reset Link
            </LoadingButton>
          </View>

          {/* Sign in link */}
          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Remember your password? </Text>
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
  backContainer: {
    alignItems: 'flex-start',
    marginBottom: 24,
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
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
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
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  email: {
    fontWeight: '600',
    color: '#111827',
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 48,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 320,
  },
});
