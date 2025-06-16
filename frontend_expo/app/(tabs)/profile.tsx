import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, Switch } from 'react-native';
import { User, Settings, Moon, Sun, Palette, Bell, Shield, HelpCircle, LogOut, ChevronRight, Edit3 } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useTheme, Theme, AccentColor } from '@/lib/theme-context';

interface ProfileSection {
  id: string;
  title: string;
  items: ProfileItem[];
}

interface ProfileItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  action: 'navigate' | 'toggle' | 'custom';
  value?: boolean;
  onPress?: () => void;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const profileSections: ProfileSection[] = [
    {
      id: 'appearance',
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          title: 'Theme',
          subtitle: theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Custom',
          icon: theme === 'dark' ? Moon : Sun,
          action: 'custom',
          onPress: () => {
            // Cycle through common themes
            const themes: Theme[] = ['light', 'dark', 'cupcake', 'corporate'];
            const currentIndex = themes.indexOf(theme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            setTheme(nextTheme);
          },
        },
        {
          id: 'accent',
          title: 'Accent Color',
          subtitle: accentColor.charAt(0).toUpperCase() + accentColor.slice(1),
          icon: Palette,
          action: 'custom',
          onPress: () => {
            // Cycle through accent colors
            const colors: AccentColor[] = ['primary', 'secondary', 'accent', 'success', 'warning'];
            const currentIndex = colors.indexOf(accentColor);
            const nextColor = colors[(currentIndex + 1) % colors.length];
            setAccentColor(nextColor);
          },
        },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Daily reminders and insights',
          icon: Bell,
          action: 'toggle',
          value: notificationsEnabled,
          onPress: () => setNotificationsEnabled(!notificationsEnabled),
        },
      ],
    },
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          id: 'privacy',
          title: 'Privacy & Security',
          subtitle: 'Manage your data and privacy settings',
          icon: Shield,
          action: 'navigate',
        },
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'FAQs, contact us, and resources',
          icon: HelpCircle,
          action: 'navigate',
        },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderProfileItem = (item: ProfileItem) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.profileItem}
      onPress={item.onPress}
      disabled={!item.onPress}
    >
      <View style={styles.profileItemLeft}>
        <View style={styles.profileItemIcon}>
          <item.icon size={20} color="#6B7280" />
        </View>
        <View style={styles.profileItemContent}>
          <Text style={styles.profileItemTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.profileItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.profileItemRight}>
        {item.action === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        )}
        {item.action === 'navigate' && (
          <ChevronRight size={20} color="#D1D5DB" />
        )}
        {item.action === 'custom' && (
          <ChevronRight size={20} color="#D1D5DB" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton}>
          <Edit3 size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <User size={32} color="#6B7280" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.firstName || user?.email || 'Your Name'
              }
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'your.email@example.com'}</Text>
          </View>
        </View>

        {/* User Stats */}
        <View style={styles.userStats}>
          <View style={styles.userStatItem}>
            <Text style={styles.userStatValue}>23</Text>
            <Text style={styles.userStatLabel}>Days Active</Text>
          </View>
          <View style={styles.userStatDivider} />
          <View style={styles.userStatItem}>
            <Text style={styles.userStatValue}>1,247</Text>
            <Text style={styles.userStatLabel}>Total XP</Text>
          </View>
          <View style={styles.userStatDivider} />
          <View style={styles.userStatItem}>
            <Text style={styles.userStatValue}>Level 3</Text>
            <Text style={styles.userStatLabel}>Current</Text>
          </View>
        </View>

        {/* Profile Sections */}
        {profileSections.map((section) => (
          <View key={section.id} style={styles.profileSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionItems}>
              {section.items.map(renderProfileItem)}
            </View>
          </View>
        ))}

        {/* Logout Section */}
        <View style={styles.profileSection}>
          <View style={styles.sectionItems}>
            <TouchableOpacity 
              style={[styles.profileItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <View style={styles.profileItemLeft}>
                <View style={[styles.profileItemIcon, styles.logoutIcon]}>
                  <LogOut size={20} color="#EF4444" />
                </View>
                <View style={styles.profileItemContent}>
                  <Text style={[styles.profileItemTitle, styles.logoutText]}>
                    Sign Out
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Journal App v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with ❤️ for personal growth</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userAvatar: {
    width: 64,
    height: 64,
    backgroundColor: '#F3F4F6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
  },
  userStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  userStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  profileSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionItems: {
    backgroundColor: '#FFFFFF',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  profileItemRight: {
    marginLeft: 12,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutIcon: {
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#EF4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
});
