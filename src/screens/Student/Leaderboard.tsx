import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getLeaderboard } from '../../services/firestore';
import type { LeaderboardEntry } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const TABS = ['This month'];

// Assign colors to top 3 + rest
const PODIUM_STYLES = [
  { color: COLORS.surface, textColor: COLORS.link }, // 1st
  { color: COLORS.surface, textColor: COLORS.success }, // 2nd
  { color: COLORS.surface, textColor: COLORS.warning }, // 3rd
];

const AVATAR_COLORS = [COLORS.surface, COLORS.surface, COLORS.surface, COLORS.surface, COLORS.surface];
const AVATAR_TEXT_COLORS = [COLORS.link, COLORS.success, COLORS.warning, COLORS.secondary, COLORS.muted];

export default function LeaderboardScreen() {
  const { userProfile } = useAuth();
  const uid = userProfile?.uid ?? '';

  const [activeTab, setActiveTab] = useState('This month');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getLeaderboard();
      setEntries(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Calculate days left in the current month
  const getDaysLeft = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  };

  // Split top 3 for podium, rest for list
  const topThree = entries.slice(0, 3);
  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = topThree.length >= 3
    ? [topThree[1], topThree[0], topThree[2]]
    : topThree;

  const renderPodiumItem = (item: LeaderboardEntry, isCenter: boolean) => {
    const podiumIdx = item.rank - 1;
    const style = PODIUM_STYLES[podiumIdx] || PODIUM_STYLES[0];

    return (
      <View key={item.uid} style={[styles.podiumItem, isCenter ? styles.podiumCenter : null]}>
        <View
          style={[
            styles.podiumAvatar,
            { backgroundColor: style.color },
            isCenter && styles.podiumAvatarCenter,
          ]}
        >
          <Text
            style={[
              styles.podiumAvatarText,
              { color: style.textColor },
              isCenter && styles.podiumAvatarTextCenter,
            ]}
          >
            {item.initials}
          </Text>
        </View>
        <Text style={styles.podiumName}>{item.name.split(' ')[0]}</Text>
        <Text style={styles.podiumPoints}>{item.points}</Text>

        <View style={[styles.podiumBase, isCenter ? styles.podiumBaseCenter : styles.podiumBaseSide]}>
          {item.rank === 1 && <Text style={styles.medalIcon}>🥇</Text>}
          {item.rank === 2 && <Text style={styles.medalIcon}>🥈</Text>}
          {item.rank === 3 && <Text style={styles.medalIcon}>🥉</Text>}
        </View>
      </View>
    );
  };

  const renderListItem = ({ item }: { item: LeaderboardEntry }) => {
    const isMe = item.uid === uid;
    const colorIdx = (item.rank - 1) % AVATAR_COLORS.length;

    return (
      <View style={styles.listRow}>
        <Text style={styles.listRank}>{item.rank}</Text>

        <View style={[styles.listAvatar, { backgroundColor: AVATAR_COLORS[colorIdx] }]}>
          <Text style={[styles.listAvatarText, { color: AVATAR_TEXT_COLORS[colorIdx] }]}>
            {item.initials}
          </Text>
        </View>

        <View style={styles.listInfo}>
          <View style={styles.listNameRow}>
            <Text style={[styles.listName, isMe && styles.listNameActive]}>{item.name}</Text>
            {isMe && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>you</Text>
              </View>
            )}
          </View>
          <Text style={styles.listSubtext}>
            {item.room ? `${item.room} • ` : ''}{item.totalTasksDone} tasks
          </Text>
        </View>

        <Text style={[styles.listPoints, isMe && styles.listPointsActive]}>{item.points}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* PURPLE HEADER SECTION */}
      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <View style={styles.daysLeftPill}>
              <View style={styles.redDot} />
              <Text style={styles.daysLeftText}>{getDaysLeft()} days left</Text>
            </View>
          </View>

          <View style={styles.segmentedControl}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Podium */}
          {podiumOrder.length > 0 && (
            <View style={styles.podiumContainer}>
              {podiumOrder.map((item, idx) =>
                renderPodiumItem(item, idx === 1) // center item is the 1st place
              )}
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* LIST SECTION */}
      <View style={styles.listContainer}>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.uid}
          renderItem={renderListItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  headerBackground: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.hero,
    color: COLORS.text,
  },
  daysLeftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overlayDark,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  redDot: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.error,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  daysLeftText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlayDark,
    borderRadius: RADIUS.xl,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.white,
  },
  segmentText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.muted,
  },
  segmentTextActive: {
    color: COLORS.primary,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 180,
  },
  podiumItem: {
    alignItems: 'center',
    width: 80,
    marginHorizontal: SPACING.sm,
  },
  podiumCenter: {
    marginBottom: SPACING.sm,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  podiumAvatarCenter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginBottom: SPACING.sm,
  },
  podiumAvatarText: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
  },
  podiumAvatarTextCenter: {
    ...TYPOGRAPHY.large,
  },
  podiumName: {
    ...TYPOGRAPHY.bodyMuted,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  podiumPoints: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
    marginBottom: SPACING.xs,
  },
  podiumBase: {
    width: '100%',
    backgroundColor: COLORS.overlayLight,
    borderTopLeftRadius: RADIUS.sm,
    borderTopRightRadius: RADIUS.sm,
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  podiumBaseCenter: {
    height: 70,
  },
  podiumBaseSide: {
    height: 50,
  },
  medalIcon: {
    fontSize: 20,
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    marginTop: -SPACING.lg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  flatListContent: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  listRank: {
    width: 30,
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.muted,
    textAlign: 'center',
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  listAvatarText: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
  },
  listInfo: {
    flex: 1,
  },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  listNameActive: {
    color: COLORS.secondary,
  },
  youBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.xs,
  },
  youBadgeText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  listSubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
  },
  listPoints: {
    ...TYPOGRAPHY.cardTitle,
    color: COLORS.secondary,
  },
  listPointsActive: {
    color: COLORS.secondary,
  },
});
