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
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { verifyBeforeUpdateEmail } from 'firebase/auth';

import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../contexts/ToastContext';
import { AppAvatar } from '../../components/Avatar';
import Card from '../../components/Card';
import FadeInView from '../../components/FadeInView';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { changePassword, sendPasswordReset, logout } from '../../services/auth';
import { db, auth } from '../../services/firebase';

export default function ProfileScreen() {
  const { userProfile } = useAuth();
  const user = useUser();
  const { showToast } = useToast();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Email state
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);

  const avatarScale = useRef(new Animated.Value(1)).current;

  const handleAvatarPressIn = () => { Animated.spring(avatarScale, { toValue: 0.95, useNativeDriver: true }).start(); };
  const handleAvatarPressOut = () => { Animated.spring(avatarScale, { toValue: 1, useNativeDriver: true }).start(); };

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
      showToast("❌ Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      uploadImage(result.assets[0].uri);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) return showToast("⚠️ Password must be at least 6 characters", "error");
    if (newPassword !== confirmPassword) return showToast("⚠️ Passwords don't match", "error");
    setChangingPassword(true);
    try {
      await changePassword(newPassword);
      showToast("✅ Password changed successfully!", "success");
      setNewPassword(''); setConfirmPassword(''); setEditModalVisible(false);
    } catch (e: any) {
      showToast(`❌ ${e.message}`, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = user?.email || userProfile?.email || '';
    if (email.endsWith('@tq.app')) return showToast("📧 Contact admin to reset password", "info");
    try {
      await sendPasswordReset(email);
      showToast("📧 Password reset email sent!", "success");
    } catch (e: any) {
      showToast("📧 Contact admin to reset password", "info");
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) return showToast("⚠️ Valid email required", "error");
    if (newEmail === displayUser?.email) return showToast("⚠️ Email is the same", "error");
    
    setChangingEmail(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("No authenticated user.");
      
      // Update Firebase Auth - sends verification link
      await verifyBeforeUpdateEmail(firebaseUser, newEmail);
      
      setEmailLinkSent(true);
      showToast("✉️ Verification link sent! Check your new email.", "success");
      
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
         showToast("❌ Please log out and back in to change email.", "error");
      } else {
         showToast(`❌ ${e.message}`, "error");
      }
    } finally {
      setChangingEmail(false);
    }
  };

  const handleConfirmEmailChange = async () => {
    setChangingEmail(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("No authenticated user.");
      
      // Reload the user data from Firebase to check if they clicked the link
      await firebaseUser.reload();
      
      if (firebaseUser.email === newEmail) {
        // Verification was successful! Update Firestore now.
        const uid = user?.uid || userProfile?.uid || firebaseUser.uid;
        await updateDoc(doc(db, 'users', uid), { email: newEmail });
        
        showToast("✅ Email changed and synced successfully!", "success");
        setEmailModalVisible(false);
        setEmailLinkSent(false);
      } else {
        showToast("⚠️ Email not verified yet. Please click the link in your inbox.", "error");
      }
    } catch (e: any) {
      showToast(`❌ ${e.message}`, "error");
    } finally {
      setChangingEmail(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => await logout() }
    ]);
  };

  const displayUser = user || userProfile;

  const renderActionRow = (icon: any, color: string, title: string, subtitle?: string, onPress?: () => void, borderBottom = true) => (
    <TouchableOpacity style={[styles.actionRow, !borderBottom && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={[styles.actionIconBox, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.actionTextCol}>
        <Text style={styles.actionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
      </View>
      {onPress && <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.mutedText} />}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.container}>
      {/* Background Ambience Removed as per polish requests */}

      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Top Profile Card */}
        <FadeInView delay={0}>
          <LinearGradient colors={[COLORS.glassBackgroundLv1, COLORS.glassBackgroundLv2]} style={styles.heroProfileCard}>
            <LinearGradient colors={[COLORS.gradientCardTop, COLORS.gradientCardBottom]} style={styles.topLight} />
            <View style={styles.heroProfileInner}>
              <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }] }]}>
                <TouchableOpacity onPress={pickImage} onPressIn={handleAvatarPressIn} onPressOut={handleAvatarPressOut} activeOpacity={0.9}>
                  <AppAvatar user={displayUser} size={84} />
                  <View style={styles.cameraIcon}>
                    <MaterialCommunityIcons name="camera" size={14} color={COLORS.white} />
                  </View>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.heroTextWrap}>
                <Text style={styles.heroName}>{displayUser?.name || 'Student'}</Text>
                {displayUser?.teamName ? (
                  <View style={styles.heroTeamBadge}>
                    <MaterialCommunityIcons name="shield-star" size={14} color={COLORS.accent} />
                    <Text style={styles.heroTeamText}>Team {displayUser.teamName}</Text>
                  </View>
                ) : (
                  <Text style={styles.heroSubtitle}>{displayUser?.email}</Text>
                )}
              </View>
            </View>

            {/* Micro Stats inside Hero */}
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{displayUser?.pointsThisMonth || 0}</Text>
                <Text style={styles.heroStatLabel}>Points</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{displayUser?.totalTasksDone || 0}</Text>
                <Text style={styles.heroStatLabel}>Tasks</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{displayUser?.streakDays || 0}</Text>
                <Text style={styles.heroStatLabel}>Streak</Text>
              </View>
            </View>
          </LinearGradient>
        </FadeInView>

        {uploading && <Text style={{ color: COLORS.accent, textAlign: 'center', marginBottom: SPACING.lg }}>Uploading image...</Text>}

        {/* Section: ACCOUNT */}
        <FadeInView delay={50}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <Card style={styles.glassGroupCard}>
            {renderActionRow('account-edit', COLORS.link, 'Edit Profile Photo', 'Update your avatar', pickImage)}
            {renderActionRow('lock-reset', COLORS.warning, 'Change Password', 'Update your security key', () => setEditModalVisible(true))}
            {renderActionRow('email', COLORS.mutedText, 'Email Address', displayUser?.email || 'N/A', () => {
              setNewEmail(displayUser?.email || '');
              setEmailModalVisible(true);
            }, false)}
          </Card>
        </FadeInView>

        {/* Section: APP */}
        <FadeInView delay={100}>
          <Text style={styles.sectionHeader}>APP</Text>
          <Card style={styles.glassGroupCard}>
            {renderActionRow('card-account-details-outline', COLORS.success, 'Student ID', displayUser?.studentId || 'N/A')}
            {renderActionRow('cake-variant-outline', COLORS.accent, 'Date of Birth', displayUser?.dateOfBirth || 'N/A', undefined, false)}
          </Card>
        </FadeInView>

        {/* Section: GENERAL */}
        <FadeInView delay={150}>
          <Text style={styles.sectionHeader}>GENERAL</Text>
          <Card style={styles.glassGroupCard}>
            {renderActionRow('help-circle-outline', COLORS.link, 'Help & Support', 'Get assistance with TaskQuest')}
            {renderActionRow('logout-variant', COLORS.error, 'Sign Out', 'Log out of your account', handleLogout, false)}
          </Card>
        </FadeInView>

        <View style={{height: 150}}/>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalVisible(false)}>
        <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.mutedText}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.modalLabel}>Confirm Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.mutedText}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={changingPassword}>
              <Text style={styles.saveBtnText}>{changingPassword ? "Updating..." : "Update Password"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Change Email Modal */}
      <Modal visible={emailModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEmailModalVisible(false)}>
        <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Email</Text>
            <TouchableOpacity onPress={() => setEmailModalVisible(false)} style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalLabel}>New Email Address</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new email"
              placeholderTextColor={COLORS.mutedText}
              keyboardType="email-address"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={(text) => {
                setNewEmail(text);
                if (emailLinkSent) setEmailLinkSent(false); // Reset if they start typing again
              }}
            />

            {!emailLinkSent ? (
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangeEmail} disabled={changingEmail}>
                <Text style={styles.saveBtnText}>{changingEmail ? "Sending..." : "Send Verification Link"}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ marginTop: SPACING.md }}>
                <Text style={{ color: COLORS.success, fontSize: 13, marginBottom: SPACING.md, textAlign: 'center' }}>
                  ✉️ Verification link sent! Please click the link in your inbox to verify, then tap the button below.
                </Text>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.success }]} onPress={handleConfirmEmailChange} disabled={changingEmail}>
                  <Text style={styles.saveBtnText}>{changingEmail ? "Checking..." : "I have verified it, Update"}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, paddingTop: SPACING.sm },
  headerTitle: { ...TYPOGRAPHY.hero, color: COLORS.white },
  content: { padding: SPACING.lg },
  
  heroProfileCard: {
    padding: SPACING.xl, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: SPACING.xl, overflow: 'hidden', shadowColor: COLORS.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15,
  },
  topLight: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  heroProfileInner: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  avatarWrapper: { borderRadius: 46, borderWidth: 2, borderColor: COLORS.glassBorder, padding: 2 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.link, borderRadius: 12, padding: 4, borderWidth: 2, borderColor: COLORS.glassBackgroundLv1 },
  heroTextWrap: { flex: 1, marginLeft: SPACING.lg },
  heroName: { ...TYPOGRAPHY.header, fontSize: 24, color: COLORS.white, marginBottom: 4 },
  heroSubtitle: { ...TYPOGRAPHY.small, color: COLORS.mutedText },
  heroTeamBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(236, 201, 75, 0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(236,201,75,0.4)', gap: 6 },
  heroTeamText: { ...TYPOGRAPHY.small, fontWeight: '800', color: COLORS.accent },

  heroStatsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: RADIUS.md, paddingVertical: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { ...TYPOGRAPHY.header, fontSize: 20, color: COLORS.white, marginBottom: 2 },
  heroStatLabel: { ...TYPOGRAPHY.badge, color: COLORS.mutedText },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  sectionHeader: { ...TYPOGRAPHY.small, fontWeight: '800', color: COLORS.mutedText, letterSpacing: 1.5, marginLeft: SPACING.md, marginBottom: SPACING.sm },
  glassGroupCard: { padding: 0, overflow: 'hidden', marginBottom: SPACING.xl },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  actionIconBox: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionTextCol: { flex: 1, marginLeft: SPACING.md },
  actionTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: COLORS.white },
  actionSubtitle: { ...TYPOGRAPHY.small, color: COLORS.mutedText, marginTop: 2 },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.glassBackgroundLv1, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  modalTitle: { ...TYPOGRAPHY.header, color: COLORS.white },
  modalCloseBtn: { padding: 8, backgroundColor: COLORS.glassBackgroundLv2, borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalContent: { padding: SPACING.xl },
  modalLabel: { fontSize: 13, fontWeight: '800', color: COLORS.mutedText, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.md },
  modalInput: { backgroundColor: COLORS.glassBackgroundLv3, color: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder, fontSize: 16, marginBottom: SPACING.sm },
  saveBtn: { backgroundColor: COLORS.link, paddingVertical: SPACING.lg, borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING.xl },
  saveBtnText: { ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.white },
});
