// Context setup onboarding screen
// Helps users define their personal context and goals

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, ArrowLeft } from 'lucide-react-native';
import { z } from 'zod';

import { useAuth } from '@/lib/auth-context';
import { FormInput } from '@/components/ui/FormInput';
import { LoadingButton } from '@/components/ui/Loading';

const contextSchema = z.object({
  contexts: z.array(z.object({
    key: z.string().min(1, 'Context name is required'),
    values: z.array(z.string()).min(1, 'At least one value is required'),
  })).min(1, 'At least one context is required'),
});

type ContextFormData = z.infer<typeof contextSchema>;

const defaultContexts = [
  {
    key: 'goals',
    values: [''],
    placeholder: 'e.g., Learn Spanish, Run a marathon, Start a business',
    description: 'What are your main goals or aspirations?',
  },
  {
    key: 'values',
    values: [''],
    placeholder: 'e.g., Family, Growth, Creativity, Adventure',
    description: 'What values are most important to you?',
  },
  {
    key: 'challenges',
    values: [''],
    placeholder: 'e.g., Time management, Procrastination, Work-life balance',
    description: 'What challenges are you currently facing?',
  },
];

export default function ContextSetupScreen() {
  const { updateUserContext } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContextFormData>({
    resolver: zodResolver(contextSchema),
    defaultValues: {
      contexts: defaultContexts.map(ctx => ({
        key: ctx.key,
        values: [''],
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contexts',
  });

  const onSubmit = async (data: ContextFormData) => {
    setIsSubmitting(true);
    try {
      // Filter out empty values and prepare data
      const contextData = data.contexts.map(context => ({
        key: context.key,
        values: context.values.filter(value => value.trim() !== ''),
      })).filter(context => context.values.length > 0);

      await updateUserContext(contextData);
      router.push('/(onboarding)/preferences');
    } catch (error) {
      Alert.alert(
        'Setup Failed',
        error instanceof Error ? error.message : 'An error occurred while saving your context'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/(onboarding)/preferences');
  };

  const addContext = () => {
    append({ key: '', values: [''] });
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
          
          <Text style={styles.title}>Tell Us About Yourself</Text>
          <Text style={styles.subtitle}>
            This helps us provide better insights and suggestions tailored to your journey
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {fields.map((field, contextIndex) => {
            const defaultContext = defaultContexts[contextIndex];
            
            return (
              <View key={field.id} style={styles.contextSection}>
                <View style={styles.contextHeader}>
                  <Controller
                    control={control}
                    name={`contexts.${contextIndex}.key`}
                    render={({ field: { onChange, value } }) => (
                      <FormInput
                        label="Context Name"
                        placeholder={defaultContext?.key || 'e.g., goals, hobbies, relationships'}
                        value={value}
                        onChangeText={onChange}
                        error={errors.contexts?.[contextIndex]?.key?.message}
                        required
                      />
                    )}
                  />
                  
                  {contextIndex >= defaultContexts.length && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => remove(contextIndex)}
                    >
                      <X size={20} />
                    </button>
                  )}
                </View>

                {defaultContext?.description && (
                  <Text style={styles.contextDescription}>
                    {defaultContext.description}
                  </Text>
                )}

                <Controller
                  control={control}
                  name={`contexts.${contextIndex}.values.0`}
                  render={({ field: { onChange, value } }) => (
                    <FormInput
                      placeholder={defaultContext?.placeholder || 'Enter values separated by commas'}
                      value={value}
                      onChangeText={(text) => {
                        // Split by commas and update the values array
                        const values = text.split(',').map(v => v.trim());
                        onChange(text);
                        // Update the entire values array in the form
                        const contexts = [...(control._formValues.contexts || [])];
                        contexts[contextIndex] = {
                          ...contexts[contextIndex],
                          values: values,
                        };
                      }}
                      error={errors.contexts?.[contextIndex]?.values?.message}
                      multiline
                      numberOfLines={3}
                    />
                  )}
                />
              </View>
            );
          })}

          <button
            className="btn btn-outline btn-sm w-full"
            onClick={addContext}
          >
            <Plus size={16} />
            Add Another Context
          </button>
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
            Continue
          </LoadingButton>

          <button
            className="btn btn-ghost btn-lg w-full"
            onClick={handleSkip}
          >
            Skip for Now
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
  contextSection: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  contextDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 16,
  },
});
