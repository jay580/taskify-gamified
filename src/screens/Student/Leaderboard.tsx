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

const TABS = ['This month', 'All time'];

// Assign colors to top 3 + rest
const PODIUM_STYLES = [
  { color: '#E3F2FD', textColor: '#1976D2' }, // 1st
  { color: '#E8F5E9', textColor: '#388E3C' }, // 2nd
  { color: '#FFF3E0', textColor: '#F57C00' }, // 3rd
];

const AVATAR_COLORS = ['#F3E5F5', '#E3F2FD', '#FFF3E0', '#E8F5E9', '#ECEFF1'];
const AVATAR_TEXT_COLORS = ['#7B1FA2', '#1976D2', '#F57C00', '#388E3C', '#455A64'];

export default function LeaderboardScreen() {
  const { userProfile } = useAuth();
  const uid = userProfile?.uid ?? '';

  const [activeTab, setActiveTab] = useState('This month');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const mode = activeTab === 'This month' ? 'monthly' : 'alltime';
      const data = await getLeaderboard(mode);
      setEntries(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

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
            {item.room ? `${item.room} • ` : ''}{item.totalTasks} tasks
          </Text>
        </View>

        <Text style={[styles.listPoints, isMe && styles.listPointsActive]}>{item.points}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6200EE" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBackground: {
    backgroundColor: '#5E35B1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  daysLeftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  redDot: {
    width: 8,
    height: 8,
    backgroundColor: '#FF5252',
    borderRadius: 4,
    marginRight: 6,
  },
  daysLeftText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: '#D1C4E9',
    fontWeight: '600',
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#5E35B1',
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
    marginHorizontal: 10,
  },
  podiumCenter: {
    marginBottom: 10,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#7E57C2',
  },
  podiumAvatarCenter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginBottom: 10,
  },
  podiumAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  podiumAvatarTextCenter: {
    fontSize: 20,
  },
  podiumName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  podiumPoints: {
    color: '#D1C4E9',
    fontSize: 12,
    marginBottom: 8,
  },
  podiumBase: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
    paddingTop: 10,
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
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  flatListContent: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  listRank: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9E9E9E',
    textAlign: 'center',
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  listAvatarText: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  listNameActive: {
    color: '#6200EE',
  },
  youBadge: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  listSubtext: {
    color: '#9E9E9E',
    fontSize: 13,
  },
  listPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  listPointsActive: {
    color: '#6200EE',
  },
});
