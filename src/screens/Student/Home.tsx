import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAvailableTasks,
  getAppSettings,
  getLeaderboard,
} from '../../services/firestore';
import type { Task, AppSettings } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { userProfile, refreshProfile } = useAuth();

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
      setTasks(taskList.slice(0, 3)); // Show top 3 as daily quests
      setSettings(appSettings);

      // Find current user's rank
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

  const formatDeadline = (iso: string | null) => {
    if (!iso) return 'No deadline';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffH = Math.round(diffMs / 3600000);
    if (diffH < 0) return 'Expired';
    if (diffH < 24) return `${diffH}h left`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Academic': return COLORS.link;
      case 'Domestic': return COLORS.success;
      case 'Sports': return COLORS.warning;
      case 'Special': return COLORS.secondary;
      default: return COLORS.secondary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  const displayName = userProfile?.name ?? 'Student';
  const points = userProfile?.pointsThisMonth ?? 0;
  const streak = userProfile?.streakDays ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />}
      >
        {/* TOP PURPLE HEADER SECTION */}
        <View style={styles.headerBackground}>
          <SafeAreaView edges={['top']}>
            {/* Profile Info */}
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.profileTextContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.nameText}>{displayName}</Text>
              </View>
              <View style={styles.iconButtonsRow}>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialCommunityIcons name="magnify" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.white} />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="trophy-outline" size={28} color={COLORS.accent} />
                <Text style={styles.statLabel}>Rank</Text>
                <Text style={styles.statValue}>#{rank || '-'}</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="star-outline" size={28} color={COLORS.gold} />
                <Text style={styles.statLabel}>Points</Text>
                <Text style={styles.statValue}>{points}</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="trending-up" size={28} color={COLORS.success} />
                <Text style={styles.statLabel}>Streak</Text>
                <Text style={styles.statValue}>{streak}d</Text>
              </View>
            </View>

            <Text style={styles.sectionTitleDark}>Daily Quests</Text>
          </SafeAreaView>
        </View>

        {/* DAILY QUESTS LIST */}
        <View style={styles.questsContainer}>
          {tasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No quests available right now</Text>
            </View>
          ) : (
            tasks.map((quest) => {
              const color = getCategoryColor(quest.category);
              const timeText = formatDeadline(quest.deadline);
              const isExpired = timeText === 'Expired';
              return (
                <View key={quest.id} style={styles.questCard}>
                  <View style={[styles.questIconBox, { backgroundColor: COLORS.surfaceAlt }]}>
                    <MaterialCommunityIcons
                      name={isExpired ? 'check-circle-outline' : 'clock-outline'}
                      size={28}
                      color={isExpired ? COLORS.success : color}
                    />
                  </View>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <View style={styles.questTagsRow}>
                      <View style={styles.questTag}>
                        <Text style={styles.questTagText}>{quest.category}</Text>
                      </View>
                      <Text style={styles.questTimeText}>• {timeText}</Text>
                    </View>
                  </View>
                  <View style={styles.questPointsBox}>
                    <Text style={styles.pointsPlus}>+{quest.points}</Text>
                    <Text style={styles.pointsLabel}>POINTS</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* REWARD OF THE MONTH */}
        {settings && (
          <View style={styles.rewardContainer}>
            <View style={styles.rewardCard}>
              <View style={styles.rewardHeader}>
                <MaterialCommunityIcons name="gift-outline" size={20} color={COLORS.white} />
                <Text style={styles.rewardTitleText}>REWARDS THIS MONTH</Text>
              </View>
              <Text style={styles.rewardMainTitle}>🥇 {settings.reward1st}</Text>
              <Text style={styles.rewardSubtext}>🥈 {settings.reward2nd} • 🥉 {settings.reward3rd}</Text>
              <TouchableOpacity
                style={styles.rewardButton}
                onPress={() => navigation.navigate('Rank')}
              >
                <Text style={styles.rewardButtonText}>Check Leaderboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ANNOUNCEMENT */}
        {settings?.announcement && (
          <View style={styles.announcementContainer}>
            <View style={styles.announcementCard}>
              <MaterialCommunityIcons name="bullhorn-outline" size={24} color={COLORS.link} />
              <Text style={styles.announcementText}>{settings.announcement}</Text>
            </View>
          </View>
        )}

        {/* Spacer for bottom tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBackground: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  welcomeText: {
    ...TYPOGRAPHY.bodyMuted,
    color: COLORS.muted,
  },
  nameText: {
    ...TYPOGRAPHY.large,
    color: COLORS.text,
  },
  iconButtonsRow: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.overlayLight,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statCard: {
    backgroundColor: COLORS.overlayLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    width: '31%',
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
    marginTop: SPACING.xs,
    marginBottom: 4,
  },
  statValue: {
    ...TYPOGRAPHY.large,
    color: COLORS.text,
  },
  sectionTitleDark: {
    ...TYPOGRAPHY.large,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  questsContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
  },
  questCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  questIconBox: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  questTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questTag: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  questTagText: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
  },
  questTimeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.mutedText,
    marginLeft: SPACING.xs,
  },
  questPointsBox: {
    alignItems: 'flex-end',
  },
  pointsPlus: {
    ...TYPOGRAPHY.cardTitle,
    color: COLORS.secondary,
  },
  pointsLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.muted,
    marginTop: 2,
  },
  rewardContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  rewardCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  rewardTitleText: {
    ...TYPOGRAPHY.small,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: SPACING.xs,
    letterSpacing: 1,
  },
  rewardMainTitle: {
    ...TYPOGRAPHY.header,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  rewardSubtext: {
    ...TYPOGRAPHY.bodyMuted,
    color: COLORS.accentLight,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  rewardButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    alignSelf: 'flex-start',
  },
  rewardButtonText: {
    ...TYPOGRAPHY.bodyMuted,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  announcementContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  announcementCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementText: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.bodyMuted,
    color: COLORS.link,
    lineHeight: 20,
  },
});
