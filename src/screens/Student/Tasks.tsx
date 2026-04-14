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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getAvailableTasks,
  getStudentSubmissions,
  getCompletedSubmissions,
  submitSelfTask,
} from '../../services/firestore';
import type { Task, Submission, TaskCategory } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme';
import FadeInView from '../../components/FadeInView';
import TaskCard from '../../components/TaskCard';
import { getTaskStatus, getTaskStatusLabel } from '../../utils/taskStatus';

const PRIMARY_TABS = ['Available', 'Submissions', 'Completed'];
const CATEGORIES = ['All', 'Academic', 'Domestic', 'Sports', 'Special'];

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case 'Academic': return COLORS.link;
    case 'Domestic': return COLORS.success;
    case 'Sports': return COLORS.warning;
    case 'Special': return COLORS.secondary;
    default: return COLORS.secondary;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return COLORS.warning;
    case 'rejected': return COLORS.error;
    case 'approved': return COLORS.success;
    default: return COLORS.muted;
  }
};

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function TasksScreen({ route }: any) {
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
  const [selfPhotos, setSelfPhotos] = useState<string[]>([]);
  const [selfPhotoUploading, setSelfPhotoUploading] = useState(false);

  const fabScale = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    if (route?.params?.category) {
      setActiveCategory(route.params.category);
      setActiveTab('Available');
      // Clear param to prevent sticky behavior when navigating internally
      navigation.setParams({ category: undefined });
    }
  }, [route?.params?.category]);

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
    Animated.spring(fabScale, { toValue: 0.9, tension: 120, friction: 8, useNativeDriver: true }).start();
  };

  const handleFabPressOut = () => {
    Animated.spring(fabScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }).start();
  };

  const getDisplayData = (): any[] => {
    let data: any[] = [];
    if (activeTab === 'Available') {
      data = availableTasks;
    } else if (activeTab === 'Submissions') {
      data = submissions;
    } else {
      data = completed;
    }

    // Only apply category filter on 'Available' tab, since Submissions don't strictly retain category in schema
    if (activeCategory !== 'All' && activeTab === 'Available') {
      data = data.filter(item => item.category === activeCategory);
    }
    return data;
  };

  const renderAvailableTask = (item: Task, index: number) => {
    const isExpired = getTaskStatus({ createdAt: item.createdAt, duration: item.duration, durationType: item.durationType }) === 'expired';
    const rawTime = getTaskStatusLabel({ createdAt: item.createdAt, duration: item.duration, durationType: item.durationType }) || '';
    const timeText = isExpired ? 'Expired' : rawTime.includes('ago') ? rawTime : `⏳ Ends in ${rawTime}`;
    return (
      <FadeInView delay={index * 80}>
        <TaskCard
          title={item.title}
          category={item.category}
          timeText={timeText}
          points={item.points}
          isExpired={isExpired}
          onPress={() => navigation.navigate('TaskDetail', { task: item })}
        />
      </FadeInView>
    );
  };

  const renderSubmissionCard = (item: Submission, index: number) => {
    const color = getCategoryColor(item.category || 'Domestic');
    const statusColor = getStatusColor(item.status);
    return (
      <FadeInView delay={index * 80}>
        <SubmissionGlassCard 
          item={item} 
          color={color} 
          statusColor={statusColor} 
          onPress={undefined} // Submissions don't have detail page yet
        />
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

  const data = getDisplayData();

  return (
    <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <Text style={styles.headerTitle}>Tasks</Text>

        {/* Glass Segmented Control */}
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

      {/* Category Glass Pills */}
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
                <Text style={isActive ? styles.filterTextActive : styles.filterTextInactive}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={data as any}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => 
          activeTab === 'Available' 
            ? renderAvailableTask(item as Task, index) 
            : renderSubmissionCard(item as Submission, index)
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />}
        ListEmptyComponent={
          <Animated.View style={styles.emptyContainer}>
            <View style={{ shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 30 }}>
              <MaterialCommunityIcons name="star-shooting" size={72} color={COLORS.secondary} />
            </View>
            <Text style={styles.emptyText}>Nothing here right now!</Text>
            {activeTab !== 'Available' && (
              <TouchableOpacity style={{ marginTop: SPACING.md, padding: 10 }} onPress={() => { setActiveTab('Available'); setActiveCategory('All'); }}>
                <Text style={{ color: COLORS.link, fontWeight: 'bold' }}>Explore More Quests</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        }
      />

      {/* Self-task Glow FAB */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          onPress={() => setSelfTaskModalVisible(true)}
        >
          <LinearGradient
            colors={[COLORS.secondary, '#C53030']}
            style={StyleSheet.absoluteFillObject}
          />
          <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={selfTaskModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelfTaskModalVisible(false)}>
        <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.selfTaskModal}>
          <SafeAreaView style={{flex: 1}}>
            <View style={styles.selfTaskHeader}>
              <Text style={styles.selfTaskTitle}>Create Self Task</Text>
              <TouchableOpacity onPress={() => setSelfTaskModalVisible(false)} style={styles.selfTaskCloseBtn}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.selfTaskContent}>
              <Text style={styles.selfTaskLabel}>What did you do?</Text>
              <TextInput
                style={styles.selfTaskInput}
                placeholder="Task Title"
                placeholderTextColor={COLORS.mutedText}
                value={selfTitle}
                onChangeText={setSelfTitle}
              />

              <Text style={styles.selfTaskLabel}>Describe your contribution</Text>
              <TextInput
                style={[styles.selfTaskInput, { height: 120, textAlignVertical: 'top' }]}
                placeholder="What did you do and why does it matter?"
                placeholderTextColor={COLORS.mutedText}
                value={selfDesc}
                onChangeText={setSelfDesc}
                multiline
              />

              <Text style={styles.selfTaskLabel}>Photo (optional)</Text>
              <TouchableOpacity style={styles.photoUploadBtn} onPress={handlePickPhoto} disabled={selfPhotoUploading}>
                <MaterialCommunityIcons name="camera" size={20} color={COLORS.white} />
                <Text style={styles.photoUploadText}>
                  {selfPhotos.length > 0 ? 'Add/Change Photos' : 'Upload Photos'}
                </Text>
              </TouchableOpacity>
              
              {selfPhotos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 10}}>
                  {selfPhotos.map((uri, index) => (
                    <View key={`${uri}-${index}`} style={{ marginRight: 10, position: 'relative' }}>
                      <Image source={{ uri }} style={{ width: 110, height: 110, borderRadius: RADIUS.md }} />
                      <TouchableOpacity onPress={() => setSelfPhotos(p => p.filter((_, i) => i !== index))} style={styles.photoRemoveBtn}>
                        <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[styles.selfTaskSubmitBtn, selfSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitSelfTask}
                disabled={selfSubmitting}
              >
                <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
                <Text style={styles.selfTaskSubmitText}>{selfSubmitting ? "Submitting..." : "Submit for Review"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

function SubmissionGlassCard({ item, color, statusColor, onPress }: { item: Submission, color: string, statusColor: string, onPress?: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        activeOpacity={0.9}
        disabled={!onPress}
      >
        <LinearGradient colors={[COLORS.gradientCardTop, COLORS.gradientCardBottom]} style={styles.topLight} />
        
        {/* Adjusted pending badge length fix */}
        <View style={[styles.pendingBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.pendingBadgeText} numberOfLines={1}>
            {item.status.toUpperCase()}
          </Text>
        </View>

        <View style={{flexDirection: 'row', gap: SPACING.md, alignItems: 'center'}}>
          <View style={styles.leftCol}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={{flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', alignItems: 'center'}}>
              <Text style={styles.timeText}>{formatDate(item.submittedAt)}</Text>
              {item.type === 'self' && (
                <View style={styles.selfTag}>
                  <Text style={styles.selfTagText}>SELF</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.rightCol}>
            <View style={styles.pointsBadge}>
              <Text style={[styles.pointsPlus, { color: COLORS.white }]}>{item.pointsAwarded || 0}</Text>
              <MaterialCommunityIcons name="star" size={14} color={COLORS.gold} style={{marginLeft: 2}} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  headerTitle: {
    ...TYPOGRAPHY.header,
    fontSize: 28,
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassBackgroundLv1,
    borderRadius: RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.glassHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  segmentText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  filterSection: {
    marginBottom: SPACING.md,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterPill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  filterPillActive: {
    backgroundColor: COLORS.glassHighlight,
    borderColor: COLORS.link,
  },
  filterPillInactive: {
    backgroundColor: COLORS.glassBackgroundLv3,
    borderColor: COLORS.glassBorder,
  },
  filterTextActive: {
    ...TYPOGRAPHY.small,
    fontWeight: '700',
    color: COLORS.link,
  },
  filterTextInactive: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 220, // Clear the navbar and FAB completely
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.white,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 120, // Safely above new 100px navbar
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary, // fallback
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    backgroundColor: COLORS.glassBackgroundLv2,
  },
  topLight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%'
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cardTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  timeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  pendingBadge: {
    position: 'absolute',
    right: 12, // Strict padding fix
    top: 12,
    maxWidth: 90, // Fix badge overflow constraint
    zIndex: 10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 18, // Since pendingBadge is absolute on top
  },
  pointsPlus: {
    fontSize: 16,
    fontWeight: '800',
  },
  selfTag: {
    backgroundColor: COLORS.link,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selfTagText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
  // Modal Style Rebalance
  selfTaskModal: {
    flex: 1,
  },
  selfTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  selfTaskTitle: {
    ...TYPOGRAPHY.header,
    color: COLORS.white,
  },
  selfTaskCloseBtn: {
    padding: 8,
    backgroundColor: COLORS.glassBackgroundLv1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  selfTaskContent: {
    padding: SPACING.lg,
  },
  selfTaskLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  selfTaskInput: {
    backgroundColor: COLORS.glassBackgroundLv3,
    color: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  photoUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: COLORS.glassBackgroundLv2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  photoUploadText: {
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  photoRemoveBtn: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  selfTaskSubmitBtn: {
    backgroundColor: COLORS.success,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.xl,
  },
  selfTaskSubmitText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
