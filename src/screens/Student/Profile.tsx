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
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'Academic': return { icon: 'book-outline', color: COLORS.link };
    case 'Domestic': return { icon: 'broom', color: COLORS.success };
    case 'Sports':   return { icon: 'run', color: COLORS.warning };
    case 'Special':  return { icon: 'star-outline', color: COLORS.secondary };
    default:         return { icon: 'check-circle-outline', color: COLORS.success };
  }
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'approved': return { label: 'Approved', color: COLORS.success };
    case 'rejected': return { label: 'Rejected', color: COLORS.error };
    case 'pending':  return { label: 'Pending',  color: COLORS.warning };
    default:         return { label: status, color: COLORS.muted };
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
    const { icon, color: iconColor } = getCategoryIcon('Domestic'); // Default to domestic for now
    const { label, color: statusColor } = getStatusInfo(item.status);

    return (
      <View style={styles.taskCard}>
        <View style={styles.taskIconBox}>
          <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskMeta}>
            {item.type === 'self' ? 'Self-created' : 'Task'}  •  {formatDate(item.submittedAt)}
          </Text>
        </View>
        <View style={styles.taskResultBox}>
          <Text style={styles.pointsPlus}>+{item.pointsAwarded}</Text>
          <Text style={[styles.statusLabel, { color: statusColor }]}>{label}</Text>
        </View>
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

  const name = userProfile?.name ?? 'Student';
  const studentId = userProfile?.studentId ?? '';
  const totalTasksDone = userProfile?.totalTasksDone ?? 0;
  const pointsThisMonth = userProfile?.pointsThisMonth ?? 0;
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
              <MaterialCommunityIcons name="cog-outline" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.identitySection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            </View>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{studentId}</Text>

            <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalTasksDone}</Text>
              <Text style={styles.statLabelText}>Tasks Done</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{pointsThisMonth}</Text>
              <Text style={styles.statLabelText}>Points This Month</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Task History Section */}
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Past Tasks</Text>
          <MaterialCommunityIcons name="history" size={22} color={COLORS.text} />
        </View>
        <FlatList
          data={pastTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderPastTaskItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
          }
          ListEmptyComponent={
            <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
              <Text style={{ color: COLORS.muted, ...TYPOGRAPHY.body }}>No past tasks yet</Text>
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
    backgroundColor: COLORS.backgroundPrimary,
  },
  headerBackground: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.header,
    color: COLORS.text,
  },
  settingsIcon: {
    padding: 4,
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  avatarInitials: {
    ...TYPOGRAPHY.hero,
    color: COLORS.white,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  levelBadgeText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.white,
  },
  userName: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    ...TYPOGRAPHY.bodyMuted,
    color: COLORS.muted,
    marginBottom: SPACING.md,
  },
  editProfileButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlayLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  editProfileText: {
    ...TYPOGRAPHY.bodyMuted,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlayDark,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.overlayLight,
  },
  statNumber: {
    ...TYPOGRAPHY.large,
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabelText: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  historyTitle: {
    ...TYPOGRAPHY.large,
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  taskIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  taskMeta: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
  },
  taskResultBox: {
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
  },
  pointsPlus: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  statusLabel: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
});
