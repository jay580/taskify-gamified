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
import { useAuth } from '../../contexts/AuthContext';
import {
  getAvailableTasks,
  getStudentSubmissions,
  getCompletedSubmissions,
} from '../../services/firestore';
import type { Task, Submission, TaskCategory } from '../../types';

const PRIMARY_TABS = ['Available', 'Submissions', 'Completed'];
const CATEGORIES = ['All', 'Academic', 'Domestic', 'Sports', 'Special'];

// Styling helpers
const getCategoryStyle = (cat: TaskCategory) => {
  switch (cat) {
    case 'Academic': return { iconColor: '#1976D2', tagColor: '#E3F2FD', tagTextColor: '#1976D2' };
    case 'Domestic': return { iconColor: '#388E3C', tagColor: '#E8F5E9', tagTextColor: '#388E3C' };
    case 'Sports':   return { iconColor: '#F57C00', tagColor: '#FFF3E0', tagTextColor: '#F57C00' };
    case 'Special':  return { iconColor: '#6200EE', tagColor: '#F3E5F5', tagTextColor: '#6200EE' };
    default:         return { iconColor: '#6200EE', tagColor: '#F3E5F5', tagTextColor: '#6200EE' };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':  return '#FFA000';
    case 'rejected': return '#D32F2F';
    case 'approved': return '#4CAF50';
    default:         return '#757575';
  }
};

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function TasksScreen() {
  const { userProfile } = useAuth();
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
        ...getCategoryStyle(t.category),
      }));
    } else if (activeTab === 'Submissions') {
      data = submissions.map(s => ({
        id: s.id,
        title: s.taskTitle,
        category: s.taskCategory,
        date: formatDate(s.submittedAt),
        points: s.taskPoints,
        icon: s.status === 'rejected' ? 'close-circle-outline' : 'clock-outline',
        ...getCategoryStyle(s.taskCategory),
        status: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        statusColor: getStatusColor(s.status),
      }));
    } else {
      data = completed.map(s => ({
        id: s.id,
        title: s.taskTitle,
        category: s.taskCategory,
        date: formatDate(s.submittedAt),
        points: s.taskPoints,
        icon: 'check-circle-outline',
        ...getCategoryStyle(s.taskCategory),
      }));
    }

    if (activeCategory !== 'All') {
      data = data.filter(task => task.category === activeCategory);
    }
    return data;
  };

  const renderTaskCard = ({ item }: { item: any }) => (
    <View style={styles.cardContainer}>
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
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6200EE" />
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
              <MaterialCommunityIcons name="dots-horizontal" size={28} color="#FFF" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} />}
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
    backgroundColor: '#F8F9FA',
  },
  headerBackground: {
    backgroundColor: '#5E35B1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 25,
    padding: 4,
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
  filterSection: {
    marginTop: -20,
  },
  filterScroll: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterPillActive: {
    backgroundColor: '#6200EE',
  },
  filterPillInactive: {
    backgroundColor: '#333333',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  filterPillTextInactive: {
    color: '#E0E0E0',
    fontWeight: '600',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  cardContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#A0A0A0',
    fontSize: 12,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardPointsBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  pointsPlus: {
    color: '#64B5F6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsLabel: {
    color: '#A0A0A0',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#757575',
    fontSize: 16,
  },
});
