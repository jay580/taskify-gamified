import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TABS = ['This month', 'All time'];

// Mock Data
const TOP_THREE = [
  { rank: 2, name: 'Rahul', initials: 'RN', points: 680, color: '#E8F5E9', textColor: '#388E3C', medal: 'silver' },
  { rank: 1, name: 'Arjun', initials: 'AM', points: 920, color: '#E3F2FD', textColor: '#1976D2', medal: 'gold' },
  { rank: 3, name: 'Priya', initials: 'PS', points: 760, color: '#FFF3E0', textColor: '#F57C00', medal: 'bronze' },
];

const LEADERBOARD_LIST = [
  { id: 'u1', rank: 2, initials: 'J', name: 'Jay', isMe: true, details: 'Room 4B • 17 tasks', points: 840, avatarColor: '#F3E5F5', avatarText: '#7B1FA2' },
  { id: 'u2', rank: 1, initials: 'AM', name: 'Arjun Mehta', isMe: false, details: 'Room 3A • 19 tasks', points: 920, avatarColor: '#E3F2FD', avatarText: '#1976D2' },
  { id: 'u3', rank: 3, initials: 'PS', name: 'Priya Sharma', isMe: false, details: 'Room 2C • 15 tasks', points: 760, avatarColor: '#FFF3E0', avatarText: '#F57C00' },
  { id: 'u4', rank: 4, initials: 'RN', name: 'Rahul Nair', isMe: false, details: 'Room 1A • 14 tasks', points: 680, avatarColor: '#E8F5E9', avatarText: '#388E3C' },
  { id: 'u5', rank: 5, initials: 'SP', name: 'Sneha Patil', isMe: false, details: 'Room 3B • 13 tasks', points: 620, avatarColor: '#ECEFF1', avatarText: '#455A64' },
];

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState('This month');

  const renderPodiumItem = (item: any, isCenter: boolean) => {
    return (
      <View key={item.name} style={[styles.podiumItem, isCenter ? styles.podiumCenter : null]}>
        {/* Avatar */}
        <View style={[
          styles.podiumAvatar, 
          { backgroundColor: item.color },
          isCenter && styles.podiumAvatarCenter
        ]}>
          <Text style={[
            styles.podiumAvatarText, 
            { color: item.textColor },
            isCenter && styles.podiumAvatarTextCenter
          ]}>
            {item.initials}
          </Text>
        </View>
        <Text style={styles.podiumName}>{item.name}</Text>
        <Text style={styles.podiumPoints}>{item.points}</Text>
        
        {/* Podium Base */}
        <View style={[
          styles.podiumBase, 
          isCenter ? styles.podiumBaseCenter : styles.podiumBaseSide
        ]}>
           {item.rank === 1 && <Text style={styles.medalIcon}>🥇</Text>}
           {item.rank === 2 && <Text style={styles.medalIcon}>🥈</Text>}
           {item.rank === 3 && <Text style={styles.medalIcon}>🥉</Text>}
        </View>
      </View>
    );
  };

  const renderListItem = ({ item }: { item: any }) => (
    <View style={styles.listRow}>
      <Text style={styles.listRank}>{item.rank}</Text>
      
      <View style={[styles.listAvatar, { backgroundColor: item.avatarColor }]}>
        <Text style={[styles.listAvatarText, { color: item.avatarText }]}>{item.initials}</Text>
      </View>
      
      <View style={styles.listInfo}>
        <View style={styles.listNameRow}>
          <Text style={[styles.listName, item.isMe && styles.listNameActive]}>{item.name}</Text>
          {item.isMe && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>you</Text>
            </View>
          )}
        </View>
        <Text style={styles.listSubtext}>{item.details}</Text>
      </View>
      
      <Text style={[styles.listPoints, item.isMe && styles.listPointsActive]}>{item.points}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* PURPLE HEADER SECTION */}
      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']}>
          {/* Top Row */}
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <View style={styles.daysLeftPill}>
              <View style={styles.redDot} />
              <Text style={styles.daysLeftText}>27 days left</Text>
            </View>
          </View>

          {/* Segmented Control */}
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
          <View style={styles.podiumContainer}>
            {renderPodiumItem(TOP_THREE[0], false)}
            {renderPodiumItem(TOP_THREE[1], true)}
            {renderPodiumItem(TOP_THREE[2], false)}
          </View>
        </SafeAreaView>
      </View>

      {/* LIST SECTION */}
      <View style={styles.listContainer}>
        <FlatList
          data={LEADERBOARD_LIST}
          keyExtractor={item => item.id}
          renderItem={renderListItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // List background
  },
  headerBackground: {
    backgroundColor: '#5E35B1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    // Add extra padding at the bottom so the podium fits inside the curve
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
    marginBottom: 10, // Elevates the center item slightly
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
    marginTop: -20, // Overlap the curved header slightly
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  flatListContent: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom tabs
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
