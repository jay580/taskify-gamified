import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import {
  getAvailableTasks,
  getAppSettings,
  getLeaderboard,
} from '../../services/firestore';
import type { Task, AppSettings } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme';
import { AppAvatar } from '../../components/Avatar';
import Logo from '../../components/Logo';
import FadeInView from '../../components/FadeInView';
import TaskCard from '../../components/TaskCard';
import SectionContainer from '../../components/SectionContainer';
import Card from '../../components/Card';
import { getTaskStatus, getTaskStatusLabel } from '../../utils/taskStatus';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { userProfile, refreshProfile } = useAuth();
  const user = useUser();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [rank, setRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [taskList, appSettings, leaderboard] = await Promise.all([
        getAvailableTasks(),
        getAppSettings(),
        getLeaderboard(),
      ]);
      setTasks(taskList);
      setSettings(appSettings);

      if (userProfile) {
        const idx = leaderboard.findIndex((e) => e.uid === userProfile.uid);
        setRank(idx >= 0 ? idx + 1 : 0);
      }
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshProfile()]);
    setRefreshing(false);
  }, [loadData, refreshProfile]);

  // Derive specialized lists without arbitrary slicing
  const featuredTasks = useMemo(() => {
    return tasks.filter(t => t.points >= 50 || (t as any).isFeatured);
  }, [tasks]);

  const endingSoonTasks = useMemo(() => {
    return tasks.filter(t => {
      const st = getTaskStatus({
        createdAt: t.createdAt,
        duration: t.duration,
        durationType: t.durationType,
      });
      if (st !== 'active') return false;
      
      if (t.duration && t.durationType) {
        const cDate = new Date(t.createdAt).getTime();
        const dTypeMap: any = { hours: 3600000, days: 86400000, weeks: 604800000 };
        const dMs = t.duration * (dTypeMap[t.durationType] || 0);
        const endsAt = cDate + dMs;
        const remaining = endsAt - Date.now();
        // Return true if remaining is less than or equal to 24 hours (86400000 ms)
        return remaining > 0 && remaining <= 86400000;
      }
      return false;
    });
  }, [tasks]);

  const CATEGORIES = [
    { name: 'Academic', icon: 'book-open-page-variant', color: COLORS.link },
    { name: 'Domestic', icon: 'home-variant-outline', color: COLORS.success },
    { name: 'Sports', icon: 'basketball', color: COLORS.warning },
    { name: 'Special', icon: 'star-shooting-outline', color: COLORS.secondary },
  ];

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </LinearGradient>
    );
  }

  const displayUser = user || userProfile;
  const displayName = displayUser?.name ?? 'Student';
  const points = displayUser?.pointsThisMonth ?? 0;
  const streak = displayUser?.streakDays ?? 0;

  return (
    <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.container}>
      {/* Top Background Glow */}
      <View style={styles.topGlow} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />}
      >
        <SafeAreaView edges={['top']} style={styles.headerArea}>
          {/* App Brand Header */}
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl, paddingHorizontal: SPACING.sm}}>
             <Logo size={36} />
             <Text style={{color: COLORS.white, fontWeight: '900', fontSize: 20, marginLeft: 12, letterSpacing: 3}}>TASKIFY</Text>
          </View>

          {/* Profile Row */}
          <View style={[styles.profileRow, { marginBottom: SPACING.xl }]}>
            <View style={styles.avatarContainer}>
              <AppAvatar user={displayUser} size={50} />
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.welcomeText}>Hello,</Text>
              <Text style={styles.nameText}>{displayName}</Text>
            </View>
          </View>

          {/* User Stats Glass Panel */}
          <FadeInView delay={100} style={{ marginBottom: SPACING.md }}>
            <TouchableOpacity style={styles.statsPanel} onPress={() => navigation.navigate('ProfileTab')} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.gradientCardTop, COLORS.gradientCardBottom]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Rank</Text>
                <View style={styles.statValueRow}>
                  <MaterialCommunityIcons name="trophy" size={16} color={COLORS.accent} />
                  <Text style={styles.statValue}>#{rank || '-'}</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Points</Text>
                <View style={styles.statValueRow}>
                  <MaterialCommunityIcons name="star" size={16} color={COLORS.gold} />
                  <Text style={styles.statValue}>{points}</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Streak</Text>
                <View style={styles.statValueRow}>
                  <MaterialCommunityIcons name="fire" size={16} color={COLORS.error} />
                  <Text style={styles.statValue}>{streak}d</Text>
                </View>
              </View>
              </TouchableOpacity>
          </FadeInView>
        </SafeAreaView>

        {/* Announcement Card */}
        {settings?.announcement && (
          <FadeInView delay={150}>
            <View style={styles.announcementWrapper}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.4)', 'rgba(236, 72, 153, 0.4)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.announcementCard}
              >
                <MaterialCommunityIcons name="bullhorn-variant" size={24} color={COLORS.white} style={{marginTop: 2}} />
                <View style={styles.announcementTextCol}>
                  <Text style={styles.announcementTitle}>Announcement</Text>
                  <Text style={styles.announcementText}>{settings.announcement}</Text>
                </View>
              </LinearGradient>
            </View>
          </FadeInView>
        )}

        {/* Featured Quests */}
        <FadeInView delay={200}>
          <SectionContainer title="Featured Quests" icon="star-circle" iconColor={COLORS.gold} actionText="View All" onActionPress={() => navigation.navigate('Quests')} horizontal>
            {featuredTasks.length > 0 ? (
              featuredTasks.map((task) => (
                <View key={task.id} style={{ width: 300 }}>
                  <TaskCard
                    title={task.title}
                    category={task.category}
                    timeText={getTaskStatusLabel({ createdAt: task.createdAt, duration: task.duration, durationType: task.durationType }) || ''}
                    points={task.points}
                    onPress={() => navigation.navigate('Quests')}
                  />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No featured quests right now.</Text>
            )}
          </SectionContainer>
        </FadeInView>

        {/* Ending Soon */}
        <FadeInView delay={300}>
          <SectionContainer title="Ending Soon" icon="clock-fast" iconColor={COLORS.secondary} horizontal>
            {endingSoonTasks.length > 0 ? (
              endingSoonTasks.map((task) => (
                <View key={task.id} style={{ width: 280 }}>
                  <TaskCard
                    title={task.title}
                    category={task.category}
                    timeText={getTaskStatusLabel({ createdAt: task.createdAt, duration: task.duration, durationType: task.durationType }) || ''}
                    points={task.points}
                    isExpired={false}
                    style={{ borderColor: 'rgba(229, 62, 62, 0.3)' }} // Urgent border hint
                    onPress={() => navigation.navigate('Quests')}
                  />
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { marginBottom: SPACING.lg, paddingHorizontal: SPACING.lg }]}>Nothing expiring soon!</Text>
            )}
          </SectionContainer>
        </FadeInView>

        <FadeInView delay={400}>
          <SectionContainer title="Explore Categories" icon="compass-outline" iconColor={COLORS.link} horizontal>
            {CATEGORIES.map((cat, idx) => (
              <TouchableOpacity key={idx} style={styles.categoryCard} onPress={() => navigation.navigate('Quests', { screen: 'TasksList', params: { category: cat.name } })}>
                <LinearGradient
                  colors={[`${cat.color}20`, `${cat.color}05`]}
                  style={StyleSheet.absoluteFillObject}
                />
                <MaterialCommunityIcons name={cat.icon as any} size={28} color={cat.color} />
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </SectionContainer>
        </FadeInView>

        {/* Bottom Spacing for Tab Bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: -250,
    left: -150,
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: COLORS.glowPrimary,
    opacity: 0.12,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerArea: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    borderRadius: 30,
    overflow: 'hidden',
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  welcomeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.mutedText,
    marginBottom: 2,
  },
  nameText: {
    ...TYPOGRAPHY.header,
    fontSize: 22,
    color: COLORS.white,
  },
  iconButtonsRow: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glassBackgroundLv2,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  statsPanel: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassBackgroundLv2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: SPACING.sm,
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.mutedText,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  announcementWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  announcementCard: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: COLORS.link,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  announcementTextCol: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  announcementTitle: {
    ...TYPOGRAPHY.small,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
    letterSpacing: 1,
  },
  announcementText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 22,
  },
  categoryCard: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.glassBackgroundLv3,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: SPACING.sm,
  },
  categoryName: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.mutedText,
  },
});
