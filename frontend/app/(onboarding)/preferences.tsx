// Preferences onboarding screen
// Sets up theme, accent color, and timezone preferences

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Palette, Globe, Moon, Sun } from 'lucide-react-native';

import { useAuth } from '@/lib/auth-context';
import { useTheme, Theme, AccentColor } from '@/lib/theme-context';
import { userPreferencesSchema, UserPreferencesInput } from '@/lib/api';
import { Select } from '@/components/ui/FormInput';
import { LoadingButton } from '@/components/ui/Loading';
import { preferencesStorageUtils } from '@/lib/storage';

const themes: Array<{ value: Theme; label: string; description: string }> = [
  { value: 'light', label: 'Light', description: 'Clean and bright interface' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
  { value: 'cupcake', label: 'Cupcake', description: 'Sweet and colorful' },
  { value: 'bumblebee', label: 'Bumblebee', description: 'Bright and energetic' },
  { value: 'emerald', label: 'Emerald', description: 'Natural and calming' },
  { value: 'corporate', label: 'Corporate', description: 'Professional and clean' },
  { value: 'synthwave', label: 'Synthwave', description: 'Retro and neon' },
  { value: 'dracula', label: 'Dracula', description: 'Dark with purple accents' },
];

const accentColors: Array<{ value: AccentColor; label: string; color: string }> = [
  { value: 'primary', label: 'Blue', color: '#3B82F6' },
  { value: 'secondary', label: 'Purple', color: '#8B5CF6' },
  { value: 'accent', label: 'Teal', color: '#06B6D4' },
  { value: 'success', label: 'Green', color: '#10B981' },
  { value: 'warning', label: 'Orange', color: '#F59E0B' },
  { value: 'error', label: 'Red', color: '#EF4444' },
  { value: 'info', label: 'Cyan', color: '#06B6D4' },
];

// Common timezones
const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

export default function PreferencesScreen() {
  const { updatePreferences } = useAuth();
  const { setTheme, setAccentColor } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UserPreferencesInput>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      theme: 'light',
      accentColor: 'primary',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const watchedTheme = watch('theme');
  const watchedAccentColor = watch('accentColor');

  // Apply theme preview in real-time
  React.useEffect(() => {
    if (watchedTheme) {
      setTheme(watchedTheme as Theme);
    }
  }, [watchedTheme, setTheme]);

  React.useEffect(() => {
    if (watchedAccentColor) {
      setAccentColor(watchedAccentColor as AccentColor);
    }
  }, [watchedAccentColor, setAccentColor]);

  const onSubmit = async (data: UserPreferencesInput) => {
    setIsSubmitting(true);
    try {
      await updatePreferences(data);
      
      // Mark onboarding as completed
      preferencesStorageUtils.setOnboardingCompleted(true);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Setup Failed',
        error instanceof Error ? error.message : 'An error occurred while saving your preferences'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Use default preferences
    preferencesStorageUtils.setOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.backContainer}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => router.back()}
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </View>
          
          <Text style={styles.title}>Customize Your Experience</Text>
          <Text style={styles.subtitle}>
            Choose your preferred theme, colors, and timezone to make the app yours
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Theme Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Palette size={24} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Theme</Text>
            </View>
            
            <Controller
              control={control}
              name="theme"
              render={({ field: { onChange, value } }) => (
                <View style={styles.themeGrid}>
                  {themes.map((theme) => (
                    <button
                      key={theme.value}
                      className={`btn ${value === theme.value ? 'btn-primary' : 'btn-outline'} mb-2`}
                      onClick={() => onChange(theme.value)}
                    >
                      {theme.value === 'light' && <Sun size={16} />}
                      {theme.value === 'dark' && <Moon size={16} />}
                      <span>{theme.label}</span>
                    </button>
                  ))}
                </View>
              )}
            />
            {errors.theme && (
              <Text style={styles.errorText}>{errors.theme.message}</Text>
            )}
          </View>

          {/* Accent Color Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Palette size={24} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Accent Color</Text>
            </View>
            
            <Controller
              control={control}
              name="accentColor"
              render={({ field: { onChange, value } }) => (
                <View style={styles.colorGrid}>
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      className={`btn ${value === color.value ? 'btn-primary' : 'btn-outline'} mb-2`}
                      onClick={() => onChange(color.value)}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: color.color,
                          marginRight: 8,
                        }}
                      />
                      {color.label}
                    </button>
                  ))}
                </View>
              )}
            />
            {errors.accentColor && (
              <Text style={styles.errorText}>{errors.accentColor.message}</Text>
            )}
          </View>

          {/* Timezone Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Globe size={24} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Timezone</Text>
            </View>
            
            <Controller
              control={control}
              name="timezone"
              render={({ field: { onChange, value } }) => (
                <Select
                  options={timezones}
                  value={value}
                  onChange={onChange}
                  error={errors.timezone?.message}
                  placeholder="Select your timezone"
                />
              )}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <LoadingButton
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            size="lg"
            className="w-full mb-4"
          >
            Complete Setup
          </LoadingButton>

          <button
            className="btn btn-ghost btn-lg w-full"
            onClick={handleSkip}
          >
            Use Defaults
          </button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
  },
  backContainer: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
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
  section: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  actions: {
    marginTop: 16,
  },
});
