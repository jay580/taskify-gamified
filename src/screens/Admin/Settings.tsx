import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { setRewards, resetMonth } from '../../services/settings';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { logout } from '../../services/auth';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToast } from '../../contexts/ToastContext';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateDoc } from 'firebase/firestore';
import { useUser } from '../../hooks/useUser';
import { Avatar } from '../../components/Avatar';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const user = useUser();
  const [firstPlace, setFirstPlace] = useState('');
  const [secondPlace, setSecondPlace] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load existing rewards
    const loadRewards = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().rewards) {
          const { firstPlace, secondPlace, thirdPlace } = snap.data().rewards;
          setFirstPlace(firstPlace || '');
          setSecondPlace(secondPlace || '');
          setThirdPlace(thirdPlace || '');
        }
      } catch (error) {
        console.error("Error loading settings: ", error);
      }
    };
    loadRewards();
  }, []);

  const handleSaveRewards = async () => {
    try {
      await setRewards(firstPlace, secondPlace, thirdPlace);
      showToast(" Rewards updated successfully!", "success");
    } catch (e: any) {
      showToast(` ${e.message}`, "error");
    }
  };

  const handleResetMonth = () => {
    Alert.alert(
      "End Month & Reset",
      "This will save the current leaderboard history and RESET all student points to 0. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm Reset", 
          style: "destructive", 
          onPress: async () => {
            try {
              await resetMonth();
              showToast("🔄 Monthly reset completed", "success");
            } catch (error: any) {
              showToast(`⚠️ ${error.message}`, "error");
            }
          } 
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {text: "Cancel", style: "cancel"},
      {text: "Sign Out", style: "destructive", onPress: async () => {
        try {
          await logout();
          navigation.replace('Auth');
        } catch (error) {
          console.error("Failed to logout:", error);
        }
      }}
    ])
  };

  const uploadImage = async (uri: string) => {
    if (!user?.uid) return;
    try {
      setUploading(true);

      const response = await fetch(uri);
      const blob = await response.blob();

      const storage = getStorage();
      const imageRef = ref(storage, `profiles/${user.uid}_${Date.now()}.jpg`);

      await uploadBytes(imageRef, blob, {
        contentType: 'image/jpeg',
      });
      const downloadURL = await getDownloadURL(imageRef);

      await updateDoc(doc(db, "users", user.uid), {
        profileImage: downloadURL || null,
      });

      showToast(" Profile updated!", "success");
    } catch (e: any) {
      console.log("UPLOAD ERROR:", e);
      showToast(" Upload failed", "error");
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

  return (
    <View style={styles.container}>
      <Header />
      <ScreenWrapper>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* ACCOUNT SETTINGS */}
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-cog" size={24} color={COLORS.textDark} />
            <Text style={styles.sectionTitle}>Profile</Text>
          </View>
          <Card>
            <View style={styles.accountRow}>
              <View style={styles.avatarContainer}>
                <Avatar user={user} size={80} />
              </View>
              <View style={{flex: 1, alignItems: 'center', marginBottom: SPACING.md}}>
                <Text style={styles.username}>{user?.name || 'Admin Profile'}</Text>
                <Text style={styles.userRole}>{user?.role === 'admin' ? 'Shelter Don Bosco' : 'Student'}</Text>
              </View>
              <Button 
                title={uploading ? "Uploading..." : "Change Photo"} 
                onPress={pickImage} 
                disabled={uploading}
                variant="primary" 
                style={{marginBottom: SPACING.lg}}
              />
            </View>
            <Button title="Sign Out" variant="secondary" onPress={handleLogout} />
          </Card>

          {/* REWARDS CONFIG */}
          <View style={[styles.sectionHeader, {marginTop: SPACING.lg}]}>
            <MaterialCommunityIcons name="gift" size={24} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Monthly Rewards</Text>
          </View>
          <Card>
            <View style={styles.rewardInputRow}>
              <Text style={styles.rankIcon}>🥇</Text>
              <TextInput 
                style={styles.input} 
                placeholderTextColor={COLORS.muted}
                placeholder="1st Place Reward" 
                value={firstPlace} 
                onChangeText={setFirstPlace} 
              />
            </View>

            <View style={styles.rewardInputRow}>
              <Text style={styles.rankIcon}>🥈</Text>
              <TextInput 
                style={styles.input} 
                placeholderTextColor={COLORS.muted}
                placeholder="2nd Place Reward" 
                value={secondPlace} 
                onChangeText={setSecondPlace} 
              />
            </View>

            <View style={styles.rewardInputRow}>
              <Text style={styles.rankIcon}>🥉</Text>
              <TextInput 
                style={styles.input} 
                placeholderTextColor={COLORS.muted}
                placeholder="3rd Place Reward" 
                value={thirdPlace} 
                onChangeText={setThirdPlace} 
              />
            </View>

            <Button title="Save Rewards" onPress={handleSaveRewards} style={{ marginTop: SPACING.sm }} />
          </Card>

          {/* DANGER ZONE: MONTH RESET */}
          <Card variant="danger">
            <Text style={styles.dangerTitle}>Leaderboard Reset</Text>
            <Text style={styles.dangerDesc}>
              This will safely archive the current standing and RESET every student's active points down to zero for the start of a new month.
            </Text>
            <Button title="Reset Month" variant="danger" onPress={handleResetMonth} />
          </Card>

        </ScrollView>
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  content: { paddingBottom: SPACING.xl * 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  formCard: {
    padding: SPACING.xl,
  },
  accountRow: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
    gap: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '800',
    fontSize: 16,
  },
  
  rewardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rankIcon: {
    fontSize: 28,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    color: COLORS.textDark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
  },
  
  dangerCard: {
    padding: SPACING.xl,
    borderColor: COLORS.error,
    borderWidth: 1,
    backgroundColor: 'rgba(229, 62, 62, 0.05)',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  dangerDesc: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  destroyBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  destroyBtnText: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 16,
  }
});
