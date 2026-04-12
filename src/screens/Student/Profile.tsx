import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../../components/Avatar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FadeInView from '../../components/FadeInView';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { changePassword, sendPasswordReset, logout } from '../../services/auth';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ProfileScreen() {
  const { userProfile } = useAuth();
  const user = useUser();
  const { showToast } = useToast();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Animations
  const avatarScale = useRef(new Animated.Value(1)).current;

  const handleAvatarPressIn = () => {
    Animated.spring(avatarScale, {
      toValue: 0.95,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleAvatarPressOut = () => {
    Animated.spring(avatarScale, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const uploadImage = async (uri: string) => {
    if (!user?.uid) return;
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const imageRef = ref(storage, `profiles/${user.uid}_${Date.now()}.jpg`);
      await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });
      const downloadURL = await getDownloadURL(imageRef);
      await updateDoc(doc(db, 'users', user.uid), { profileImage: downloadURL || null });
      showToast("✅ Profile image updated!", "success");
    } catch (e: any) {
      console.error('Upload error:', e);
      showToast("❌ Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      uploadImage(result.assets[0].uri);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast("⚠️ Password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("⚠️ Passwords don't match", "error");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(newPassword);
      showToast("✅ Password changed successfully!", "success");
      setNewPassword('');
      setConfirmPassword('');
      setEditModalVisible(false);
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        showToast("⚠️ Please log out and log in again before changing password", "error");
      } else {
        showToast(`❌ ${e.message}`, "error");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = user?.email || userProfile?.email || '';
    // Check if email is real (not @tq.app)
    if (email.endsWith('@tq.app')) {
      showToast("📧 Contact admin to reset password", "info");
      return;
    }
    try {
      await sendPasswordReset(email);
      showToast("📧 Password reset email sent!", "success");
    } catch (e: any) {
      showToast("📧 Contact admin to reset password", "info");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
      }
    ]);
  };

  const displayUser = user || userProfile;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Profile Card */}
        <FadeInView delay={0}>
          <View style={styles.profileSection}>
            <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }] }]}>
              <TouchableOpacity
                onPress={pickImage}
                onPressIn={handleAvatarPressIn}
                onPressOut={handleAvatarPressOut}
                activeOpacity={0.9}
              >
                <Avatar user={displayUser} size={90} />
                <View style={styles.cameraIcon}>
                  <MaterialCommunityIcons name="camera" size={14} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            </Animated.View>
            {uploading && <Text style={styles.uploadingText}>Uploading...</Text>}

            <Text style={styles.userName}>{displayUser?.name || 'Student'}</Text>
            
            {displayUser?.teamName ? (
              <View style={styles.teamBadge}>
                <MaterialCommunityIcons name="shield-star" size={14} color={COLORS.accent} />
                <Text style={styles.teamBadgeText}>Team {displayUser.teamName}</Text>
              </View>
            ) : null}
          </View>
        </FadeInView>

        {/* Stats Row */}
        <FadeInView delay={100}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{displayUser?.pointsThisMonth || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{displayUser?.totalTasksDone || 0}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{displayUser?.streakDays || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </FadeInView>

        {/* Info Section */}
        <FadeInView delay={200}>
          <Card>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email" size={20} color={COLORS.link} />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{displayUser?.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="card-account-details" size={20} color={COLORS.success} />
              <Text style={styles.infoLabel}>Student ID</Text>
              <Text style={styles.infoValue}>{displayUser?.studentId || 'N/A'}</Text>
            </View>
            {displayUser?.dateOfBirth ? (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="cake-variant" size={20} color={COLORS.warning} />
                <Text style={styles.infoLabel}>DOB</Text>
                <Text style={styles.infoValue}>{displayUser.dateOfBirth}</Text>
              </View>
            ) : null}
          </Card>
        </FadeInView>

        {/* Account Actions */}
        <FadeInView delay={300}>
          <Card>
            <TouchableOpacity style={styles.actionRow} onPress={() => setEditModalVisible(true)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="lock-reset" size={22} color={COLORS.accent} />
              <Text style={styles.actionText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.muted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionRow} onPress={handleForgotPassword} activeOpacity={0.7}>
              <MaterialCommunityIcons name="email-alert" size={22} color={COLORS.link} />
              <Text style={styles.actionText}>Forgot Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          </Card>
        </FadeInView>

        {/* Logout */}
        <FadeInView delay={400}>
          <Button title="Sign Out" variant="danger" onPress={handleLogout} style={{ marginTop: SPACING.md }} />
        </FadeInView>

      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.modalLabel}>Confirm Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Button
              title={changingPassword ? "Changing..." : "Change Password"}
              onPress={handleChangePassword}
              disabled={changingPassword}
              style={{ marginTop: SPACING.lg }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  header: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  headerTitle: { ...TYPOGRAPHY.hero, color: COLORS.text, marginTop: SPACING.sm },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  
  profileSection: { alignItems: 'center', marginBottom: SPACING.xl },
  avatarWrapper: {
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: SPACING.md,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.backgroundPrimary,
  },
  uploadingText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 201, 75, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(236, 201, 75, 0.3)',
  },
  teamBadgeText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 13,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  statLabel: { fontSize: 12, color: COLORS.mutedText, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundPrimary,
  },
  infoLabel: { flex: 1, color: COLORS.mutedText, fontWeight: '700', fontSize: 13 },
  infoValue: { color: COLORS.textDark, fontWeight: '600', fontSize: 14 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundPrimary,
  },
  actionText: { flex: 1, color: COLORS.textDark, fontWeight: '700', fontSize: 15 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  modalCloseBtn: { padding: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  modalContent: { padding: SPACING.xl },
  modalLabel: { fontSize: 13, fontWeight: '800', color: COLORS.mutedText, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.md },
  modalInput: {
    backgroundColor: COLORS.surfaceAlt,
    color: COLORS.textDark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
  },
});
