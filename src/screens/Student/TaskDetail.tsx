import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { submitTask } from '../../services/firestore';
import type { Task, TaskCategory } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme';
import { getTaskStatusLabel } from '../../utils/taskStatus';
import Card from '../../components/Card';
import { Platform } from 'react-native';
const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Academic: COLORS.link,
  Domestic: COLORS.success,
  Sports: COLORS.warning,
  Special: COLORS.secondary,
};

const CATEGORY_ICONS: Record<TaskCategory, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Academic: 'book-open-page-variant',
  Domestic: 'home-variant-outline',
  Sports: 'basketball',
  Special: 'star-shooting-outline',
};

interface Props {
  route: { params: { task: Task } };
  navigation: any;
}

export default function TaskDetail({ route, navigation }: Props) {
  const { task } = route.params;
  const { userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const categoryColor = CATEGORY_COLORS[task.category] || COLORS.secondary;
  const categoryIcon = CATEGORY_ICONS[task.category] || 'flag';
  const timeStatus = getTaskStatusLabel(task);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        setImages((prev) => Array.from(new Set([...prev, ...result.assets.map(a => a.uri).filter(Boolean)])));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your camera.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImages((prev) => Array.from(new Set([...prev, result.assets[0].uri])));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const handleSubmit = async () => {
    if (!userProfile) return;
    if (!images.length) {
      Alert.alert('Photo Required', 'Please upload at least one photo as proof of task completion.');
      return;
    }
    setSubmitting(true);
    try {
      await submitTask(task.id, userProfile.uid, task, images, notes.trim() || undefined);
      Alert.alert('Submitted!', 'Your task has been submitted for approval.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.container}>
      {/* Background Hero Layer */}
      <View style={[styles.heroBg, { backgroundColor: categoryColor }]} />
      <LinearGradient colors={['rgba(0,0,0,0.3)', COLORS.gradientBgStart]} style={styles.heroGradientOverlay} />

      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={26} color={COLORS.white} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Sheet Content Group */}
      <View style={styles.sheetContainer}>
        {/* Drag handle hint */}
        <View style={styles.dragHandle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerArea}>
            <View style={[styles.iconFloat, { backgroundColor: categoryColor }]}>
              <MaterialCommunityIcons name={categoryIcon} size={32} color={COLORS.white} />
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={styles.tagRow}>
                <View style={[styles.badge, { backgroundColor: `${categoryColor}20` }]}>
                  <Text style={[styles.badgeText, { color: categoryColor }]}>{task.category}</Text>
                </View>
                {timeStatus ? <Text style={styles.deadline}>⏳ {timeStatus}</Text> : null}
              </View>
            </View>
          </View>

          <Card style={styles.glassCard}>
            <View style={styles.pointsRow}>
              <MaterialCommunityIcons name="star-circle" size={28} color={COLORS.gold} />
              <Text style={styles.pointsText}>+{task.points} Power Points</Text>
            </View>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.description}>{task.description || "No specific details provided."}</Text>
          </Card>

          <Card style={styles.glassCard}>
            <Text style={styles.descriptionLabel}>Proof of Work *</Text>
            
            {images.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                {images.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.previewContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeButton} onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}>
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addMoreBtn} onPress={pickImage}>
                  <MaterialCommunityIcons name="plus" size={30} color={COLORS.white} />
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.uploadButtons}>
                <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                  <MaterialCommunityIcons name="camera-outline" size={30} color={categoryColor} />
                  <Text style={styles.uploadText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <MaterialCommunityIcons name="image-outline" size={30} color={categoryColor} />
                  <Text style={styles.uploadText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.descriptionLabel, { marginTop: SPACING.md }]}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add short notes here..."
              placeholderTextColor={COLORS.mutedText}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </Card>
          
          <View style={{height: 100}} />
        </ScrollView>
      </View>

      {/* Floating CTA fixed at bottom, above Navbar (Navbar uses ~100px at bottom) */}
      <View style={[styles.fixedBottom, { paddingBottom: Platform.OS === 'ios' ? 110 : 90 }]}>
        <LinearGradient
          colors={[COLORS.glassBackgroundLv1, COLORS.gradientBgEnd]}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', paddingHorizontal: SPACING.lg, zIndex: 10 }}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            activeOpacity={0.9}
            onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="upload" size={22} color={COLORS.white} />
                <Text style={styles.submitButtonText}>Submit for Review</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBg: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 250, opacity: 0.4,
  },
  heroGradientOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 250,
  },
  header: {
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, alignItems: 'flex-end',
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.glassBackgroundLv2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.glassBackgroundLv2,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginTop: SPACING.xl,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginTop: SPACING.md, marginBottom: SPACING.lg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 220, // Clear the fixed CTA + Navbar
  },
  headerArea: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg,
  },
  iconFloat: {
    width: 64, height: 64, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  titleWrap: { flex: 1 },
  taskTitle: {
    ...TYPOGRAPHY.header, fontSize: 24, color: COLORS.white, marginBottom: 8,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8,
  },
  badgeText: { ...TYPOGRAPHY.small, fontWeight: '700' },
  deadline: { ...TYPOGRAPHY.small, color: COLORS.error, fontWeight: '600' },
  glassCard: {
    padding: SPACING.lg,
  },
  pointsRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.md, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  pointsText: {
    ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.gold, marginLeft: 8,
  },
  descriptionLabel: {
    ...TYPOGRAPHY.small, fontWeight: '800', color: COLORS.mutedText, textTransform: 'uppercase', marginBottom: SPACING.sm, letterSpacing: 0.5,
  },
  description: {
    ...TYPOGRAPHY.body, color: COLORS.textSecondary, lineHeight: 24,
  },
  uploadButtons: {
    flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm,
  },
  uploadButton: {
    flex: 1, backgroundColor: COLORS.glassBackgroundLv3, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  uploadText: {
    ...TYPOGRAPHY.small, fontWeight: '600', color: COLORS.white, marginTop: 8,
  },
  photoList: { marginVertical: SPACING.sm },
  previewContainer: { position: 'relative', marginRight: SPACING.md },
  previewImage: { width: 100, height: 100, borderRadius: RADIUS.md },
  removeButton: { position: 'absolute', top: 4, right: 4, backgroundColor: COLORS.surface, borderRadius: 12 },
  addMoreBtn: { width: 100, height: 100, borderRadius: RADIUS.md, backgroundColor: COLORS.glassBackgroundLv3, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  notesInput: {
    backgroundColor: COLORS.glassBackgroundLv3, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.white, ...TYPOGRAPHY.body, minHeight: 80, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  fixedBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: SPACING.md, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', zIndex: 50,
  },
  submitButton: {
    backgroundColor: COLORS.secondary, paddingVertical: 18, borderRadius: RADIUS.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.white, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
});