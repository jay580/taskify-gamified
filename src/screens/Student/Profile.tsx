import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentSubmissions } from '../../services/firestore';
import type { Submission } from '../../types';

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'Academic': return { icon: 'book-outline', color: '#1976D2' };
    case 'Domestic': return { icon: 'broom', color: '#388E3C' };
    case 'Sports':   return { icon: 'run', color: '#F57C00' };
    case 'Special':  return { icon: 'star-outline', color: '#6200EE' };
    default:         return { icon: 'check-circle-outline', color: '#6200EE' };
  }
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'approved': return { label: 'Approved', color: '#4CAF50' };
    case 'rejected': return { label: 'Rejected', color: '#F44336' };
    case 'pending':  return { label: 'Pending',  color: '#FFA000' };
    default:         return { label: status, color: '#757575' };
  }
};

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function ProfileScreen() {
  const { userProfile, logout, refreshProfile } = useAuth();
  const uid = userProfile?.uid ?? '';

  const [pastTasks, setPastTasks] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      const subs = await getStudentSubmissions(uid);
      setPastTasks(subs);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshProfile()]);
    setRefreshing(false);
  }, [loadData, refreshProfile]);

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile feature coming soon!');
  };

  const handleSettings = () => {
    Alert.alert(
      'Settings',
      'Manage your account',
      [
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              Alert.alert('Error', 'Could not log out. Try again.');
            }
          },
          style: 'destructive',
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const renderPastTaskItem = ({ item }: { item: Submission }) => {
    const { icon, color: iconColor } = getCategoryIcon(item.taskCategory);
    const { label, color: statusColor } = getStatusInfo(item.status);

    return (
      <View style={styles.taskCard}>
        <View style={styles.taskIconBox}>
          <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.taskTitle}</Text>
          <Text style={styles.taskMeta}>
            {item.taskCategory}  •  {formatDate(item.submittedAt)}
          </Text>
        </View>
        <View style={styles.taskResultBox}>
          <Text style={styles.pointsPlus}>+{item.taskPoints}</Text>
          <Text style={[styles.statusLabel, { color: statusColor }]}>{label}</Text>
        </View>
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

  const name = userProfile?.name ?? 'Student';
  const email = userProfile?.email ?? '';
  const level = userProfile?.level ?? 1;
  const totalTasks = userProfile?.totalTasks ?? 0;
  const totalPoints = userProfile?.totalPoints ?? 0;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topNavRow}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity onPress={handleSettings} style={styles.settingsIcon}>
              <MaterialCommunityIcons name="cog-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.identitySection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>Lvl {level}</Text>
              </View>
            </View>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{email}</Text>

            <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalTasks}</Text>
              <Text style={styles.statLabelText}>Total Tasks</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalPoints}</Text>
              <Text style={styles.statLabelText}>Lifetime Points</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Task History Section */}
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Past Tasks</Text>
          <MaterialCommunityIcons name="history" size={22} color="#212121" />
        </View>
        <FlatList
          data={pastTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderPastTaskItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} />
          }
          ListEmptyComponent={
            <View style={{ padding: 30, alignItems: 'center' }}>
              <Text style={{ color: '#757575', fontSize: 15 }}>No past tasks yet</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerBackground: {
    backgroundColor: '#5E35B1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsIcon: {
    padding: 4,
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFB300',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#9575CD',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: '#FF5252',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5E35B1',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#D1C4E9',
    marginBottom: 15,
  },
  editProfileButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  editProfileText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 15,
    paddingVertical: 12,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabelText: {
    fontSize: 12,
    color: '#D1C4E9',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  listContent: {
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  taskIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: 12,
    color: '#757575',
  },
  taskResultBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  pointsPlus: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
