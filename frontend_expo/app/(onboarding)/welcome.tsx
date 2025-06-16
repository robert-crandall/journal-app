// Welcome onboarding screen
// Introduces the app and its core concepts

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Heart, Target, BookOpen, BarChart } from 'lucide-react-native';

import { LoadingButton } from '@/components/ui/Loading';

const features = [
  {
    icon: Heart,
    title: 'Personal Growth',
    description: 'Track your journey with meaningful insights and reflections',
  },
  {
    icon: Target,
    title: 'Quests & Goals',
    description: 'Set and achieve meaningful goals with structured tracking',
  },
  {
    icon: BookOpen,
    title: 'Smart Journaling',
    description: 'AI-powered insights help you understand your thoughts and patterns',
  },
  {
    icon: BarChart,
    title: 'Progress Tracking',
    description: 'Visualize your growth with character stats and achievements',
  },
];

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push('/(onboarding)/context-setup');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Your Journey</Text>
          <Text style={styles.subtitle}>
            A chat-first life coaching app that helps you grow through meaningful conversations and insights
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <IconComponent size={32} color="#3B82F6" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <LoadingButton
            onPress={handleGetStarted}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Get Started
          </LoadingButton>
          
          <Text style={styles.ctaSubtext}>
            Takes less than 2 minutes to set up
          </Text>
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
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 48,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  ctaContainer: {
    alignItems: 'center',
  },
  ctaSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
});
