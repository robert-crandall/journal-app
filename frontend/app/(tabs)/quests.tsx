import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { Target, Plus, Clock, CheckCircle, Star, TrendingUp } from 'lucide-react-native';

interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalSteps: number;
  category: 'health' | 'career' | 'personal' | 'relationships';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'active' | 'completed' | 'paused';
  dueDate?: Date;
  xpReward: number;
}

export default function QuestsScreen() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const mockQuests: Quest[] = [
    {
      id: '1',
      title: 'Build a Morning Routine',
      description: 'Establish a consistent morning routine that sets you up for success',
      progress: 7,
      totalSteps: 10,
      category: 'personal',
      difficulty: 'medium',
      status: 'active',
      xpReward: 150,
    },
    {
      id: '2',
      title: 'Learn a New Skill',
      description: 'Spend 30 minutes daily learning something new',
      progress: 15,
      totalSteps: 30,
      category: 'career',
      difficulty: 'medium',
      status: 'active',
      xpReward: 200,
    },
    {
      id: '3',
      title: 'Practice Gratitude',
      description: 'Write down 3 things you\'re grateful for each day',
      progress: 21,
      totalSteps: 21,
      category: 'personal',
      difficulty: 'easy',
      status: 'completed',
      xpReward: 100,
    },
    {
      id: '4',
      title: 'Improve Fitness',
      description: 'Exercise for at least 30 minutes, 4 times per week',
      progress: 12,
      totalSteps: 16,
      category: 'health',
      difficulty: 'hard',
      status: 'active',
      xpReward: 250,
    },
  ];

  const activeQuests = mockQuests.filter(quest => quest.status === 'active');
  const completedQuests = mockQuests.filter(quest => quest.status === 'completed');

  const getCategoryColor = (category: Quest['category']) => {
    switch (category) {
      case 'health': return '#10B981';
      case 'career': return '#3B82F6';
      case 'personal': return '#8B5CF6';
      case 'relationships': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getDifficultyColor = (difficulty: Quest['difficulty']) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderQuest = (quest: Quest) => (
    <TouchableOpacity key={quest.id} style={styles.questCard}>
      <View style={styles.questHeader}>
        <View style={styles.questTitleRow}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          {quest.status === 'completed' && (
            <CheckCircle size={20} color="#10B981" />
          )}
        </View>
        <Text style={styles.questDescription}>{quest.description}</Text>
      </View>

      <View style={styles.questProgress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${(quest.progress / quest.totalSteps) * 100}%`,
                backgroundColor: quest.status === 'completed' ? '#10B981' : '#3B82F6'
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {quest.progress}/{quest.totalSteps}
        </Text>
      </View>

      <View style={styles.questFooter}>
        <View style={styles.questMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(quest.category) + '20' }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(quest.category) }]}>
              {quest.category}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quest.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(quest.difficulty) }]}>
              {quest.difficulty}
            </Text>
          </View>
        </View>
        <View style={styles.xpReward}>
          <Star size={16} color="#F59E0B" />
          <Text style={styles.xpText}>{quest.xpReward} XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Quests</Text>
          <Text style={styles.headerSubtitle}>Your personal growth challenges</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Target size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{activeQuests.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <CheckCircle size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{completedQuests.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <TrendingUp size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>
            {completedQuests.reduce((sum, quest) => sum + quest.xpReward, 0)}
          </Text>
          <Text style={styles.statLabel}>XP Earned</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active ({activeQuests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({completedQuests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quest List */}
      <ScrollView style={styles.questsList} showsVerticalScrollIndicator={false}>
        {(activeTab === 'active' ? activeQuests : completedQuests).map(renderQuest)}
        
        {(activeTab === 'active' ? activeQuests : completedQuests).length === 0 && (
          <View style={styles.emptyState}>
            <Target size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>
              {activeTab === 'active' ? 'No Active Quests' : 'No Completed Quests'}
            </Text>
            <Text style={styles.emptyStateDescription}>
              {activeTab === 'active' 
                ? 'Start your first quest to begin your journey!'
                : 'Complete some quests to see them here.'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  questsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  questHeader: {
    marginBottom: 12,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  questDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  questProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 40,
    textAlign: 'right',
  },
  questFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
});
