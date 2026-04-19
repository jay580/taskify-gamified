import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getLeaderboard, claimReward, getAppSettings } from '../../services/firestore';
import { observeTeamLeaderboard, TeamSchema } from '../../services/teams';
import type { LeaderboardEntry, AppSettings } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';
import FadeInView from '../../components/FadeInView';
import Card from '../../components/Card';
import { useToast } from '../../contexts/ToastContext';

const TABS = ['Student Rank', 'Team Rank'];

// Advanced podium structure logic
const PODIUM_STYLES = [
  { glow: COLORS.gold, baseHighlight: 'rgba(236, 201, 75, 0.3)', medal: 'shield-crown' },       // 1st
  { glow: COLORS.link, baseHighlight: 'rgba(159, 122, 234, 0.2)', medal: 'shield-half-full' },   // 2nd
  { glow: COLORS.warning, baseHighlight: 'rgba(237, 137, 54, 0.2)', medal: 'shield-outline' },   // 3rd
];

function TeamPodium({ teams }: { teams: TeamSchema[] }) {
  const topTeams = teams.slice(0, 3);
  if (!topTeams.length) return null;

  const ranked = topTeams.map((team, index) => ({ ...team, rank: index + 1 }));
  const ordered = ranked.length >= 3 ? [ranked[1], ranked[0], ranked[2]] : ranked;

  const renderTeamPodiumItem = (team: any, isCenter: boolean) => {
    const styleIdx = team.rank - 1;
    const style = PODIUM_STYLES[styleIdx] || PODIUM_STYLES[2];
    
    return (
      <View key={team.id} style={[styles.podiumItem, isCenter ? styles.podiumCenter : null]}>
        <View style={[styles.avatarGlow, { shadowColor: style.glow }]}>
          <View style={[styles.podiumAvatar, isCenter && styles.podiumAvatarCenter, { borderColor: style.glow }]}>
            <MaterialCommunityIcons name="account-group" size={isCenter ? 32 : 24} color={style.glow} />
          </View>
        </View>
        <Text style={styles.podiumName} numberOfLines={1}>{team.name}</Text>
        <Text style={styles.podiumPoints}>{team.totalPoints} pts</Text>

        <LinearGradient
          colors={[style.baseHighlight, 'transparent']}
          style={[styles.podiumBase, isCenter ? styles.podiumBaseCenter : styles.podiumBaseSide, { borderColor: `${style.glow}40` }]}
        >
          <MaterialCommunityIcons name={style.medal as any} size={isCenter ? 28 : 22} color={style.glow} />
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.podiumContainer}>
      {ordered.map((team) => renderTeamPodiumItem(team, team.rank === 1))}
    </View>
  );
}

export default function LeaderboardScreen() {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const uid = userProfile?.uid ?? '';

  const [activeTab, setActiveTab] = useState('Student Rank');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<TeamSchema[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [leaderboardData, appSettings] = await Promise.all([
        getLeaderboard(),
        getAppSettings()
      ]);
      setEntries(leaderboardData);
      setSettings(appSettings);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData();
    const unsubTeams = observeTeamLeaderboard(setTeams);
    return () => unsubTeams();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleClaimReward = async (rank: number) => {
    if (!userProfile) return;
    
    let rewardTitle = '';
    if (rank === 1) rewardTitle = settings?.reward1st || '1st Place Prize';
    else if (rank === 2) rewardTitle = settings?.reward2nd || '2nd Place Prize';
    else if (rank === 3) rewardTitle = settings?.reward3rd || '3rd Place Prize';

    setClaiming(true);
    try {
      await claimReward(userProfile.uid, userProfile.name, rank, rewardTitle);
      showToast("Reward claim sent to Admin!", "success");
    } catch (error) {
      showToast("Failed to claim reward", "error");
    } finally {
      setClaiming(false);
    }
  };

  const topThree = entries.slice(0, 3);
  const podiumOrder = topThree.length >= 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;

  const renderPodiumItem = (item: LeaderboardEntry, isCenter: boolean) => {
    const styleIdx = item.rank - 1;
    const style = PODIUM_STYLES[styleIdx] || PODIUM_STYLES[2];
    const isMe = item.uid === uid;

    return (
      <View key={item.uid} style={[styles.podiumItem, isCenter ? styles.podiumCenter : null]}>
        <View style={[styles.avatarGlow, { shadowColor: style.glow, elevation: isCenter ? 12 : 6 }]}>
          <View style={[styles.podiumAvatar, isCenter && styles.podiumAvatarCenter, { borderColor: style.glow }]}>
            <Text style={[styles.podiumAvatarText, isCenter && styles.podiumAvatarTextCenter, { color: COLORS.white }]}>
              {item.initials}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.podiumName} numberOfLines={1}>{item.name.split(' ')[0]}</Text>
          {item.rewardClaimed && (
            <MaterialCommunityIcons name="bee" size={22} color="#F7D060" style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text style={styles.podiumPoints}>{item.points}</Text>

        <LinearGradient
          colors={[style.baseHighlight, 'transparent']}
          style={[styles.podiumBase, isCenter ? styles.podiumBaseCenter : styles.podiumBaseSide, { borderColor: `${style.glow}40` }]}
        >
          <MaterialCommunityIcons name={style.medal as any} size={isCenter ? 28 : 22} color={style.glow} />
        </LinearGradient>
      </View>
    );
  };

  const renderListItem = ({ item }: { item: LeaderboardEntry }) => {
    const isMe = item.uid === uid;
    const isTop3 = item.rank <= 3;
    const styleIdx = isTop3 ? item.rank - 1 : 2;
    const style = PODIUM_STYLES[styleIdx];
    
    return (
      <FadeInView delay={item.rank * 50}>
        <View style={[
          styles.listRowWrapper, 
          isMe && styles.listRowWrapperMe,
          isTop3 && { borderColor: `${style.glow}60`, borderWidth: 1.5 }
        ]}>
          <LinearGradient colors={[COLORS.gradientCardTop, COLORS.gradientCardBottom]} style={styles.rowTopLight} />
          
          <Text style={[styles.listRank, isTop3 && { color: style.glow }]}>#{item.rank}</Text>

          <View style={[styles.listAvatar, isTop3 && { borderColor: style.glow }]}>
            <Text style={styles.listAvatarText}>{item.initials}</Text>
          </View>

          <View style={styles.listInfo}>
            <View style={styles.listNameRow}>
              <Text style={styles.listName}>{item.name}</Text>
              {item.rewardClaimed && (
                <MaterialCommunityIcons name="bee" size={14} color="#F7D060" style={{ marginLeft: 6 }} />
              )}
              {isMe && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>YOU</Text>
                </View>
              )}
            </View>
            <Text style={styles.listSubtext}>
              {item.teamName ? `${item.teamName} • ` : ''}{item.totalTasksDone} tasks
            </Text>
          </View>

          <View style={styles.pointsBadge}>
            <Text style={[styles.listPoints, isMe && { color: COLORS.white }]}>{item.points}</Text>
            <MaterialCommunityIcons name="star" size={14} color={COLORS.gold} style={{marginLeft:2}}/>
          </View>
        </View>
      </FadeInView>
    );
  };

  const renderTeamItem = ({ item, index }: { item: TeamSchema; index: number }) => {
    const rank = index + 1;
    return (
      <FadeInView delay={rank * 50}>
        <View style={styles.listRowWrapper}>
          <LinearGradient colors={[COLORS.gradientCardTop, COLORS.gradientCardBottom]} style={styles.rowTopLight} />
          
          <Text style={styles.listRank}>#{rank}</Text>
          <View style={[styles.listAvatar, { backgroundColor: COLORS.glassBackgroundLv3 }]}>
            <MaterialCommunityIcons name="account-group" size={20} color={COLORS.white} />
          </View>

          <View style={styles.listInfo}>
            <Text style={styles.listName}>{item.name}</Text>
            <Text style={styles.listSubtext}>{item.members.length} members</Text>
          </View>

          <View style={styles.pointsBadge}>
            <Text style={styles.listPoints}>{item.totalPoints}</Text>
            <MaterialCommunityIcons name="star" size={14} color={COLORS.gold} style={{marginLeft:2}}/>
          </View>
        </View>
      </FadeInView>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.container}>
      {/* Background Ambience */}
      <View style={styles.ambientGlow} />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>

        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
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
        </View>

        <View style={styles.podiumWrapper}>
          {activeTab === 'Student Rank' ? (
            podiumOrder.length > 0 ? (
              <View style={styles.podiumContainer}>
                {podiumOrder.map((item, idx) => renderPodiumItem(item, item.rank === 1))}
              </View>
            ) : null
          ) : (
            <TeamPodium teams={teams} />
          )}
        </View>

        <View style={styles.listContainer}>
          <FlatList
            data={activeTab === 'Student Rank' ? entries : teams}
            keyExtractor={(item, index) => ('uid' in item ? item.uid : item.id) || index.toString()}
            renderItem={activeTab === 'Student Rank' ? renderListItem as any : renderTeamItem as any}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: {
    position: 'absolute', top: -150, left: '20%', width: 400, height: 400, borderRadius: 200, backgroundColor: COLORS.glowPrimary, opacity: 0.1,
  },
  headerTopRow: {
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.hero, color: COLORS.white,
  },
  segmentedControl: {
    flexDirection: 'row', backgroundColor: COLORS.glassBackgroundLv1, borderRadius: RADIUS.xl, padding: 4, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  segmentButton: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.glassHighlight, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  segmentText: {
    ...TYPOGRAPHY.small, fontWeight: '600', color: COLORS.mutedText,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  podiumWrapper: {
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, zIndex: 10, marginTop: 25,
  },
  podiumContainer: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 210, width: '100%',
  },
  podiumItem: {
    alignItems: 'center', width: '30%', marginHorizontal: '1%',
  },
  podiumCenter: {
    marginBottom: SPACING.xl + 15, zIndex: 5, transform: [{ scale: 1.15 }],
  },
  avatarGlow: {
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 10, marginBottom: SPACING.sm,
  },
  podiumAvatar: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.glassBackgroundLv1, justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  podiumAvatarCenter: {
    width: 68, height: 68, borderRadius: 34, borderWidth: 3,
  },
  podiumAvatarText: {
    ...TYPOGRAPHY.body, fontWeight: '800',
  },
  podiumAvatarTextCenter: {
    ...TYPOGRAPHY.header,
  },
  podiumName: {
    ...TYPOGRAPHY.small, fontWeight: '800', color: COLORS.white, marginBottom: 2, textAlign: 'center',
  },
  podiumPoints: {
    ...TYPOGRAPHY.badge, color: COLORS.mutedText, marginBottom: SPACING.md,
  },
  podiumBase: {
    width: '100%', borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, alignItems: 'center', paddingTop: SPACING.sm,
  },
  podiumBaseCenter: { height: 80 },
  podiumBaseSide: { height: 60 },
  listContainer: {
    flex: 1, backgroundColor: 'rgba(11, 17, 33, 0.4)', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: COLORS.glassBorder, borderBottomWidth: 0, overflow: 'hidden',
  },
  flatListContent: {
    paddingTop: SPACING.lg, paddingHorizontal: SPACING.lg, paddingBottom: 200, gap: SPACING.md,
  },
  listRowWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassBackgroundLv3, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder, overflow: 'hidden', position: 'relative',
  },
  listRowWrapperMe: {
    backgroundColor: COLORS.glowPrimary, borderColor: COLORS.link, shadowColor: COLORS.link, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 4,
  },
  rowTopLight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
  },
  listRank: {
    width: 36, ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.mutedText, textAlign: 'center',
  },
  listAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.glassBackgroundLv2, justifyContent: 'center', alignItems: 'center', marginHorizontal: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  listAvatarText: {
    ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.white,
  },
  listInfo: { flex: 1 },
  listNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  listName: { ...TYPOGRAPHY.body, fontWeight: '700', color: COLORS.white },
  youBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: SPACING.sm, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  youBadgeText: { ...TYPOGRAPHY.badge, color: COLORS.white, fontWeight: '800' },
  listSubtext: { ...TYPOGRAPHY.small, color: COLORS.mutedText, fontWeight: '500' },
  pointsBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  listPoints: { ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.gold },
  claimButtonPodium: {
    marginTop: SPACING.xs, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1,
  },
  claimButtonList: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md, marginLeft: SPACING.md,
  },
  claimButtonText: {
    ...TYPOGRAPHY.badge, color: COLORS.white, fontWeight: '900',
  },
});
