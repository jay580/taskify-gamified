import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAvailableTasks,
  getStudentSubmissions,
  getCompletedSubmissions,
} from '../../services/firestore';
import type { Task, Submission, TaskCategory } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

const PRIMARY_TABS = ['Available', 'Submissions', 'Completed'];
const CATEGORIES = ['All', 'Academic', 'Domestic', 'Sports', 'Special'];

// Styling helpers
const getCategoryStyle = (cat: TaskCategory) => {
  switch (cat) {
    case 'Academic': return { iconColor: COLORS.link, tagColor: COLORS.surface, tagTextColor: COLORS.link };
    case 'Domestic': return { iconColor: COLORS.success, tagColor: COLORS.surface, tagTextColor: COLORS.success };
    case 'Sports':   return { iconColor: COLORS.warning, tagColor: COLORS.surface, tagTextColor: COLORS.warning };
    case 'Special':  return { iconColor: COLORS.secondary, tagColor: COLORS.surface, tagTextColor: COLORS.secondary };
    default:         return { iconColor: COLORS.secondary, tagColor: COLORS.surface, tagTextColor: COLORS.secondary };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':  return COLORS.warning;
    case 'rejected': return COLORS.error;
    case 'approved': return COLORS.success;
    default:         return COLORS.muted;
  }
};

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function TasksScreen() {
  const { userProfile } = useAuth();
  const navigation = useNavigation<any>();
  const uid = userProfile?.uid ?? '';

  const [activeTab, setActiveTab] = useState('Available');
  const [activeCategory, setActiveCategory] = useState('All');
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [completed, setCompleted] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      const [taskList, subs, comp] = await Promise.all([
        getAvailableTasks(),
        getStudentSubmissions(uid),
        getCompletedSubmissions(uid),
      ]);
      setAvailableTasks(taskList);
      // Filter submissions to only pending/rejected (not approved)
      setSubmissions(subs.filter(s => s.status !== 'approved'));
      setCompleted(comp);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Get the right data for current tab + category filter
  const getDisplayData = (): any[] => {
    let data: any[] = [];

    if (activeTab === 'Available') {
      data = availableTasks.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        date: formatDate(t.deadline),
        points: t.points,
        icon: 'clock-outline',
        task: t, // Include full task for navigation
        ...getCategoryStyle(t.category),
      }));
    } else if (activeTab === 'Submissions') {
      data = submissions.map(s => ({
        id: s.id,
        title: s.title,
        category: 'Domestic' as const, // submissions don't have category in new schema
        date: formatDate(s.submittedAt),
        points: s.pointsAwarded,
        icon: s.status === 'rejected' ? 'close-circle-outline' : 'clock-outline',
        ...getCategoryStyle('Domestic'),
        status: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        statusColor: getStatusColor(s.status),
        submission: s, // Include full submission
      }));
    } else {
      data = completed.map(s => ({
        id: s.id,
        title: s.title,
        category: 'Domestic' as const,
        date: formatDate(s.submittedAt),
        points: s.pointsAwarded,
        icon: 'check-circle-outline',
        ...getCategoryStyle('Domestic'),
        submission: s, // Include full submission
      }));
    }

    if (activeCategory !== 'All') {
      data = data.filter(task => task.category === activeCategory);
    }
    return data;
  };

  const handleTaskPress = (item: any) => {
    // Only navigate to TaskDetail for available tasks
    if (item.task) {
      navigation.navigate('TaskDetail', { task: item.task });
    }
  };

  const renderTaskCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => handleTaskPress(item)}
      activeOpacity={item.task ? 0.7 : 1}
    >
      <View style={styles.cardIconBox}>
        <MaterialCommunityIcons name={item.icon || 'clock-outline'} size={24} color={item.iconColor} />
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.cardTagsRow}>
          {item.category && item.tagColor && (
            <View style={[styles.categoryTag, { backgroundColor: item.tagColor }]}>
              <Text style={[styles.categoryTagText, { color: item.tagTextColor || '#333' }]}>
                {item.category}
              </Text>
            </View>
          )}
          <Text style={styles.dateText}>• {item.date}</Text>
          {item.status && (
            <Text style={[styles.statusText, { color: item.statusColor }]}>
              {' '}- {item.status}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.cardPointsBox}>
        <Text style={styles.pointsPlus}>+{item.points}</Text>
        <Text style={styles.pointsLabel}>POINTS</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Tasks</Text>
            <TouchableOpacity>
              <MaterialCommunityIcons name="dots-horizontal" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.segmentedControl}>
            {PRIMARY_TABS.map((tab) => {
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
        </SafeAreaView>
      </View>

      {/* Category Filters */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterPill, isActive ? styles.filterPillActive : styles.filterPillInactive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={isActive ? styles.filterPillTextActive : styles.filterPillTextInactive}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Task List */}
      <FlatList
        data={getDisplayData()}
        keyExtractor={item => item.id}
        renderItem={renderTaskCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found.</Text>
          </View>
        }
      />
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.hero,
    color: COLORS.text,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlayDark,
    borderRadius: RADIUS.xl,
    padding: 4,
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
  filterSection: {
    marginTop: -SPACING.lg,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  filterPill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    marginHorizontal: 5,
    ...SHADOWS.card,
  },
  filterPillActive: {
    backgroundColor: COLORS.secondary,
  },
  filterPillInactive: {
    backgroundColor: COLORS.surfaceAlt,
  },
  filterPillTextActive: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.white,
  },
  filterPillTextInactive: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 100,
  },
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryTag: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  categoryTagText: {
    ...TYPOGRAPHY.badge,
  },
  dateText: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
    marginLeft: SPACING.xs,
  },
  statusText: {
    ...TYPOGRAPHY.small,
    fontWeight: 'bold',
  },
  cardPointsBox: {
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
  },
  pointsPlus: {
    ...TYPOGRAPHY.cardTitle,
    color: COLORS.link,
  },
  pointsLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.muted,
    marginTop: 2,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
  },
});
