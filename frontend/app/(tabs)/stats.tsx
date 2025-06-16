import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, Dimensions } from 'react-native';
import { BarChart, TrendingUp, TrendingDown, Calendar, Zap, Trophy, Target, Activity } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Stat {
  id: string;
  name: string;
  currentValue: number;
  maxValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  color: string;
  icon: 'zap' | 'trophy' | 'target' | 'activity';
}

interface WeeklyData {
  day: string;
  value: number;
}

export default function StatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const mockStats: Stat[] = [
    {
      id: '1',
      name: 'Focus',
      currentValue: 75,
      maxValue: 100,
      unit: 'points',
      trend: 'up',
      trendValue: 12,
      color: '#3B82F6',
      icon: 'zap',
    },
    {
      id: '2',
      name: 'Resilience',
      currentValue: 60,
      maxValue: 100,
      unit: 'points',
      trend: 'up',
      trendValue: 8,
      color: '#10B981',
      icon: 'trophy',
    },
    {
      id: '3',
      name: 'Growth',
      currentValue: 45,
      maxValue: 100,
      unit: 'points',
      trend: 'stable',
      trendValue: 0,
      color: '#F59E0B',
      icon: 'target',
    },
    {
      id: '4',
      name: 'Balance',
      currentValue: 82,
      maxValue: 100,
      unit: 'points',
      trend: 'down',
      trendValue: -5,
      color: '#8B5CF6',
      icon: 'activity',
    },
  ];

  const weeklyData: WeeklyData[] = [
    { day: 'Mon', value: 65 },
    { day: 'Tue', value: 72 },
    { day: 'Wed', value: 58 },
    { day: 'Thu', value: 80 },
    { day: 'Fri', value: 75 },
    { day: 'Sat', value: 68 },
    { day: 'Sun', value: 85 },
  ];

  const achievements = [
    {
      id: '1',
      title: 'First Quest Complete',
      description: 'Completed your first personal development quest',
      earnedAt: '2 days ago',
      icon: '🏆',
    },
    {
      id: '2',
      title: 'Week Streak',
      description: 'Journaled for 7 consecutive days',
      earnedAt: '1 week ago',
      icon: '🔥',
    },
    {
      id: '3',
      title: 'Self Reflection',
      description: 'Wrote 10 thoughtful journal entries',
      earnedAt: '2 weeks ago',
      icon: '🧠',
    },
  ];

  const getStatIcon = (icon: Stat['icon']) => {
    switch (icon) {
      case 'zap': return <Zap size={20} color="#FFFFFF" />;
      case 'trophy': return <Trophy size={20} color="#FFFFFF" />;
      case 'target': return <Target size={20} color="#FFFFFF" />;
      case 'activity': return <Activity size={20} color="#FFFFFF" />;
      default: return <Zap size={20} color="#FFFFFF" />;
    }
  };

  const renderStatCard = (stat: Stat) => (
    <View key={stat.id} style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
          {getStatIcon(stat.icon)}
        </View>
        <View style={styles.statTrend}>
          {stat.trend === 'up' && <TrendingUp size={16} color="#10B981" />}
          {stat.trend === 'down' && <TrendingDown size={16} color="#EF4444" />}
          {stat.trend !== 'stable' && (
            <Text style={[
              styles.trendText,
              { color: stat.trend === 'up' ? '#10B981' : '#EF4444' }
            ]}>
              {stat.trend === 'up' ? '+' : ''}{stat.trendValue}%
            </Text>
          )}
        </View>
      </View>
      
      <Text style={styles.statName}>{stat.name}</Text>
      
      <View style={styles.statValue}>
        <Text style={styles.statNumber}>{stat.currentValue}</Text>
        <Text style={styles.statUnit}>/{stat.maxValue} {stat.unit}</Text>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { 
              width: `${(stat.currentValue / stat.maxValue) * 100}%`,
              backgroundColor: stat.color
            }
          ]} 
        />
      </View>
    </View>
  );

  const renderSimpleChart = () => {
    const maxValue = Math.max(...weeklyData.map(d => d.value));
    const chartHeight = 120;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Progress</Text>
        <View style={styles.chart}>
          <View style={styles.chartBars}>
            {weeklyData.map((data, index) => (
              <View key={index} style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      height: (data.value / maxValue) * chartHeight,
                      backgroundColor: '#3B82F6'
                    }
                  ]} 
                />
                <Text style={styles.barLabel}>{data.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Stats</Text>
          <Text style={styles.headerSubtitle}>Track your personal growth</Text>
        </View>
        <TouchableOpacity style={styles.calendarButton}>
          <Calendar size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.activePeriodButton
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.activePeriodButtonText
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overall Stats */}
        <View style={styles.overallStats}>
          <View style={styles.overallStatItem}>
            <Text style={styles.overallStatValue}>1,247</Text>
            <Text style={styles.overallStatLabel}>Total XP</Text>
          </View>
          <View style={styles.overallStatItem}>
            <Text style={styles.overallStatValue}>23</Text>
            <Text style={styles.overallStatLabel}>Days Active</Text>
          </View>
          <View style={styles.overallStatItem}>
            <Text style={styles.overallStatValue}>Level 3</Text>
            <Text style={styles.overallStatLabel}>Current Level</Text>
          </View>
        </View>

        {/* Character Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Character Stats</Text>
          <View style={styles.statsGrid}>
            {mockStats.map(renderStatCard)}
          </View>
        </View>

        {/* Chart */}
        <View style={styles.section}>
          {renderSimpleChart()}
        </View>

        {/* Recent Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>{achievement.earnedAt}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Level Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level Progress</Text>
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <Text style={styles.currentLevel}>Level 3</Text>
              <Text style={styles.nextLevel}>Next: Level 4</Text>
            </View>
            <View style={styles.xpProgress}>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: '73%' }]} />
              </View>
              <Text style={styles.xpText}>730 / 1000 XP</Text>
            </View>
            <Text style={styles.xpRemaining}>270 XP to next level</Text>
          </View>
        </View>
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
  calendarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  activePeriodButton: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  overallStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  overallStatItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  overallStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    height: 140,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  currentLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  nextLevel: {
    fontSize: 14,
    color: '#6B7280',
  },
  xpProgress: {
    marginBottom: 8,
  },
  xpBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  xpRemaining: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
