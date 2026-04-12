import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getAvailableTasks,
  getStudentSubmissions,
  getCompletedSubmissions,
  submitSelfTask,
} from '../../services/firestore';
import type { Task, Submission, TaskCategory } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';
import FadeInView from '../../components/FadeInView';
import { getTaskStatus, getTaskStatusLabel } from '../../utils/taskStatus';

const PRIMARY_TABS = ['Available', 'Submissions', 'Completed'];
const CATEGORIES = ['All', 'Academic', 'Domestic', 'Sports', 'Special'];

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
  const { showToast } = useToast();
  const uid = userProfile?.uid ?? '';

  const [activeTab, setActiveTab] = useState('Available');
  const [activeCategory, setActiveCategory] = useState('All');
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [completed, setCompleted] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Self-task modal state
  const [selfTaskModalVisible, setSelfTaskModalVisible] = useState(false);
  const [selfTitle, setSelfTitle] = useState('');
  const [selfDesc, setSelfDesc] = useState('');
  const [selfSubmitting, setSelfSubmitting] = useState(false);

  // FAB animation
  const fabScale = useRef(new Animated.Value(1)).current;

  // Self-task photo state
  const [selfPhotos, setSelfPhotos] = useState<string[]>([]);
  const [selfPhotoUploading, setSelfPhotoUploading] = useState(false);

  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      const [taskList, subs, comp] = await Promise.all([
        getAvailableTasks(),
        getStudentSubmissions(uid),
        getCompletedSubmissions(uid),
      ]);
      setAvailableTasks(taskList);
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

  const handleSubmitSelfTask = async () => {
    if (!selfTitle.trim() || !selfDesc.trim()) {
      showToast("⚠️ Title and description required", "error");
      return;
    }
    setSelfSubmitting(true);
    try {
      await submitSelfTask(uid, selfTitle.trim(), selfDesc.trim(), selfPhotos, undefined);
      showToast("🎯 Self-task submitted for review!", "success");
      setSelfTaskModalVisible(false);
      setSelfTitle('');
      setSelfDesc('');
      setSelfPhotos([]);
      await loadData();
    } catch (e: any) {
      showToast(`❌ ${e.message}`, "error");
    } finally {
      setSelfSubmitting(false);
    }
  };

  const handlePickPhoto = async () => {
    setSelfPhotoUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets.map((asset) => asset.uri).filter(Boolean);
        setSelfPhotos((prev) => Array.from(new Set([...prev, ...picked])));
      }
    } catch (e) {
      showToast('Failed to pick image', 'error');
    } finally {
      setSelfPhotoUploading(false);
    }
  };

  const handleFabPressIn = () => {
    Animated.spring(fabScale, {
      toValue: 0.9,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleFabPressOut = () => {
    Animated.spring(fabScale, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const getDisplayData = (): any[] => {
    let data: any[] = [];

    if (activeTab === 'Available') {
      data = availableTasks.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        date: '',
        points: t.points,
        icon: getTaskStatus({ createdAt: t.createdAt, duration: t.duration, durationType: t.durationType }) === 'expired'
          ? 'alert-circle-outline'
          : 'clock-outline',
        task: t,
        statusLabel: getTaskStatusLabel({ createdAt: t.createdAt, duration: t.duration, durationType: t.durationType }),
        taskStatus: getTaskStatus({ createdAt: t.createdAt, duration: t.duration, durationType: t.durationType }),
        ...getCategoryStyle(t.category),
      }));
    } else if (activeTab === 'Submissions') {
      data = submissions.map(s => ({
        id: s.id,
        title: s.title,
        category: 'Domestic' as const,
        date: formatDate(s.submittedAt),
        points: s.pointsAwarded,
        icon: s.status === 'rejected' ? 'close-circle-outline' : 'clock-outline',
        ...getCategoryStyle('Domestic'),
        status: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        statusColor: getStatusColor(s.status),
        submission: s,
        type: s.type,
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
        submission: s,
      }));
    }

    if (activeCategory !== 'All') {
      data = data.filter(task => task.category === activeCategory);
    }
    return data;
  };

  const handleTaskPress = (item: any) => {
    if (item.task) {
      navigation.navigate('TaskDetail', { task: item.task });
    }
  };

  const renderTaskCard = ({ item, index }: { item: any; index: number }) => {
    // Fade in + upward motion
    return (
      <FadeInView delay={index * 80}>
        <AnimatedPressableCard item={item} onPress={() => handleTaskPress(item)} />
      </FadeInView>
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
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderTaskCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-off" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No tasks found.</Text>
          </View>
        }
      />

      {/* Self-task FAB */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          onPress={() => setSelfTaskModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* Self-Task Modal */}
      <Modal visible={selfTaskModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelfTaskModalVisible(false)}>
        <View style={styles.selfTaskModal}>
          <View style={styles.selfTaskHeader}>
            <Text style={styles.selfTaskTitle}>Create Self Task</Text>
            <TouchableOpacity onPress={() => setSelfTaskModalVisible(false)} style={styles.selfTaskCloseBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.selfTaskContent}>
            <Text style={styles.selfTaskLabel}>What did you do?</Text>
            <TextInput
              style={styles.selfTaskInput}
              placeholder="Task Title"
              placeholderTextColor={COLORS.muted}
              value={selfTitle}
              onChangeText={setSelfTitle}
            />

            <Text style={styles.selfTaskLabel}>Describe your contribution</Text>
            <TextInput
              style={[styles.selfTaskInput, { height: 120, textAlignVertical: 'top' }]}
              placeholder="What did you do and why does it matter?"
              placeholderTextColor={COLORS.muted}
              value={selfDesc}
              onChangeText={setSelfDesc}
              multiline
            />

            {/* Photo upload */}
            <Text style={styles.selfTaskLabel}>Photo (optional)</Text>
            <TouchableOpacity
              style={[
                styles.selfTaskInput,
                { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48 },
                selfPhotoUploading && { opacity: 0.6 },
              ]}
              onPress={handlePickPhoto}
              disabled={selfPhotoUploading}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="camera" size={20} color={COLORS.link} />
              <Text style={{ color: COLORS.link, marginLeft: 8, fontWeight: '600' }}>
                {selfPhotos.length > 0 ? 'Add/Change Photos' : 'Upload Photos'}
              </Text>
            </TouchableOpacity>
            {selfPhotos.length > 0 ? (
              <View style={{ marginVertical: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selfPhotos.map((uri, index) => (
                    <View key={`${uri}-${index}`} style={{ marginRight: 10, position: 'relative' }}>
                      <Image source={{ uri }} style={{ width: 110, height: 110, borderRadius: 10 }} />
                      <TouchableOpacity
                        onPress={() => setSelfPhotos((prev) => prev.filter((_, i) => i !== index))}
                        style={{ position: 'absolute', right: 4, top: 4, backgroundColor: COLORS.surface, borderRadius: 10 }}
                      >
                        <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.selfTaskInfo}>
              <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.link} />
              <Text style={styles.selfTaskInfoText}>
                Points will be awarded by the admin after review.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.selfTaskSubmitBtn, selfSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmitSelfTask}
              disabled={selfSubmitting}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
              <Text style={styles.selfTaskSubmitText}>
                {selfSubmitting ? "Submitting..." : "Submit for Review"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// Animated pressable card component for spring scale effect
function AnimatedPressableCard({ item, onPress }: { item: any; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={item.task ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={item.task ? 0.9 : 1}
      >
        {item.status && (
          <View style={[styles.pendingBadge, { backgroundColor: item.statusColor || COLORS.warning }]}> 
            <Text style={styles.pendingBadgeText}>{item.status}</Text>
          </View>
        )}

        <View style={styles.cardIconBox}>
          <MaterialCommunityIcons name={item.icon || 'clock-outline'} size={24} color={item.iconColor} />
        </View>

        <View style={styles.cardInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.type === 'self' && (
              <View style={{ backgroundColor: COLORS.link, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: COLORS.white, fontSize: 9, fontWeight: '800' }}>SELF</Text>
              </View>
            )}
          </View>
          <View style={styles.cardTagsRow}>
            {item.category && item.tagColor && (
              <View style={[styles.categoryTag, { backgroundColor: item.tagColor }]}>
                <Text style={[styles.categoryTagText, { color: item.tagTextColor || '#333' }]}>
                  {item.category}
                </Text>
              </View>
            )}
            {item.date ? <Text style={styles.dateText}>• {item.date}</Text> : null}
          </View>
          {item.statusLabel ? (
            <Text style={{ color: item.taskStatus === 'expired' ? COLORS.error : COLORS.link, fontSize: 11, marginTop: 2 }}>
              {item.statusLabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.cardPointsBox}>
          <Text style={styles.pointsPlus}>+{item.points}</Text>
          <Text style={styles.pointsLabel}>POINTS</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    position: 'relative',
    overflow: 'hidden',
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
  pendingBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    maxWidth: '60%',
    zIndex: 10,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
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
    marginTop: SPACING.sm,
  },
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  // Self-task modal
  selfTaskModal: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  selfTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selfTaskTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  selfTaskCloseBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selfTaskContent: {
    padding: SPACING.xl,
  },
  selfTaskLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  selfTaskInput: {
    backgroundColor: COLORS.surfaceAlt,
    color: COLORS.textDark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  selfTaskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(159, 122, 234, 0.1)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  selfTaskInfoText: {
    color: COLORS.link,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  selfTaskSubmitBtn: {
    backgroundColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selfTaskSubmitText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'uppercase',
  },
});
