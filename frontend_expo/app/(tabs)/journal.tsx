import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { BookOpen, Plus, Calendar, Search, Filter, Sparkles, Heart, Brain, Target } from 'lucide-react-native';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  tags: string[];
  createdAt: string;
  insights?: string;
  wordCount: number;
}

interface InsightCard {
  id: string;
  type: 'pattern' | 'achievement' | 'reflection';
  title: string;
  description: string;
  icon: 'sparkles' | 'heart' | 'brain' | 'target';
}

export default function JournalScreen() {
  const [activeTab, setActiveTab] = useState<'entries' | 'insights'>('entries');

  const mockEntries: JournalEntry[] = [
    {
      id: '1',
      title: 'Morning Reflections',
      content: 'Started the day with meditation and feel much more centered. The breathing exercises really help with my anxiety...',
      mood: 'good',
      tags: ['meditation', 'anxiety', 'morning'],
      createdAt: new Date().toISOString(),
      wordCount: 156,
      insights: 'Your meditation practice seems to be having a positive impact on your mood.',
    },
    {
      id: '2',
      title: 'Work Challenges',
      content: 'Had a difficult conversation with my manager today. I felt heard but also realized I need to work on my communication skills...',
      mood: 'neutral',
      tags: ['work', 'communication', 'growth'],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      wordCount: 203,
    },
    {
      id: '3',
      title: 'Weekend Adventures',
      content: 'Went hiking with friends and felt so connected to nature. These moments remind me what really matters in life...',
      mood: 'great',
      tags: ['nature', 'friends', 'gratitude'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      wordCount: 187,
    },
  ];

  const mockInsights: InsightCard[] = [
    {
      id: '1',
      type: 'pattern',
      title: 'Consistent Morning Routine',
      description: 'You\'ve mentioned meditation 8 times this month. It seems to positively impact your mood.',
      icon: 'sparkles',
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Emotional Growth',
      description: 'You\'ve shown increased self-awareness in your recent entries, especially around communication.',
      icon: 'heart',
    },
    {
      id: '3',
      type: 'reflection',
      title: 'Nature Connection',
      description: 'Outdoor activities consistently improve your well-being. Consider scheduling more nature time.',
      icon: 'brain',
    },
  ];

  const getMoodColor = (mood: JournalEntry['mood']) => {
    switch (mood) {
      case 'great': return '#10B981';
      case 'good': return '#3B82F6';
      case 'neutral': return '#F59E0B';
      case 'bad': return '#EF4444';
      case 'terrible': return '#991B1B';
      default: return '#6B7280';
    }
  };

  const getMoodEmoji = (mood: JournalEntry['mood']) => {
    switch (mood) {
      case 'great': return '😊';
      case 'good': return '🙂';
      case 'neutral': return '😐';
      case 'bad': return '😟';
      case 'terrible': return '😞';
      default: return '😐';
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const getInsightIcon = (icon: InsightCard['icon']) => {
    switch (icon) {
      case 'sparkles': return <Sparkles size={20} color="#8B5CF6" />;
      case 'heart': return <Heart size={20} color="#EF4444" />;
      case 'brain': return <Brain size={20} color="#3B82F6" />;
      case 'target': return <Target size={20} color="#10B981" />;
      default: return <Sparkles size={20} color="#8B5CF6" />;
    }
  };

  const renderEntry = (entry: JournalEntry) => (
    <TouchableOpacity key={entry.id} style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryTitleRow}>
          <Text style={styles.entryTitle}>{entry.title}</Text>
          <View style={styles.moodIndicator}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
          </View>
        </View>
        <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
      </View>

      <Text style={styles.entryContent} numberOfLines={3}>
        {entry.content}
      </Text>

      {entry.insights && (
        <View style={styles.insightPreview}>
          <Sparkles size={14} color="#8B5CF6" />
          <Text style={styles.insightText} numberOfLines={2}>
            {entry.insights}
          </Text>
        </View>
      )}

      <View style={styles.entryFooter}>
        <View style={styles.tags}>
          {entry.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {entry.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{entry.tags.length - 3}</Text>
          )}
        </View>
        <Text style={styles.wordCount}>{entry.wordCount} words</Text>
      </View>
    </TouchableOpacity>
  );

  const renderInsight = (insight: InsightCard) => (
    <View key={insight.id} style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View style={styles.insightIcon}>
          {getInsightIcon(insight.icon)}
        </View>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightType}>{insight.type}</Text>
        </View>
      </View>
      <Text style={styles.insightDescription}>{insight.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Journal</Text>
          <Text style={styles.headerSubtitle}>Your thoughts and reflections</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{mockEntries.length}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {mockEntries.reduce((sum, entry) => sum + entry.wordCount, 0)}
          </Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'entries' && styles.activeTab]}
          onPress={() => setActiveTab('entries')}
        >
          <BookOpen size={18} color={activeTab === 'entries' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'entries' && styles.activeTabText]}>
            Entries
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
          onPress={() => setActiveTab('insights')}
        >
          <Sparkles size={18} color={activeTab === 'insights' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
            Insights
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'entries' ? (
          <>
            {mockEntries.map(renderEntry)}
            {mockEntries.length === 0 && (
              <View style={styles.emptyState}>
                <BookOpen size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No Entries Yet</Text>
                <Text style={styles.emptyStateDescription}>
                  Start journaling to track your thoughts and reflections
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {mockInsights.map(renderInsight)}
            {mockInsights.length === 0 && (
              <View style={styles.emptyState}>
                <Sparkles size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No Insights Yet</Text>
                <Text style={styles.emptyStateDescription}>
                  Keep journaling to unlock AI-powered insights about your patterns
                </Text>
              </View>
            )}
          </>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  entryCard: {
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
  entryHeader: {
    marginBottom: 12,
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  moodIndicator: {
    marginLeft: 8,
  },
  moodEmoji: {
    fontSize: 18,
  },
  entryDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  entryContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  insightText: {
    fontSize: 12,
    color: '#8B5CF6',
    flex: 1,
    fontStyle: 'italic',
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  tag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  wordCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  insightType: {
    fontSize: 12,
    color: '#8B5CF6',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  insightDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
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
