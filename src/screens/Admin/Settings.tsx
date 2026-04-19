import React, { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDocs, collection } from 'firebase/firestore';
import { View, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Logo from '../../components/Logo';
import { setRewards, resetMonth } from '../../services/settings';
import { setWinnersFinalized, getAppSettings } from '../../services/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { logout } from '../../services/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToast } from '../../contexts/ToastContext';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateDoc } from 'firebase/firestore';
import { useUser } from '../../hooks/useUser';
import { AppAvatar } from '../../components/Avatar';
import { Platform } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { showToast } = useToast();

  const user = useUser();
  const [firstPlace, setFirstPlace] = useState('');
  const [secondPlace, setSecondPlace] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  const [winnersFinalized, setFinalized] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load existing rewards
    const loadRewards = async () => {
      try {
        const settings = await getAppSettings();
        if (settings) {
          setFirstPlace(settings.reward1st);
          setSecondPlace(settings.reward2nd);
          setThirdPlace(settings.reward3rd);
          setFinalized(settings.winnersFinalized || false);
        }
      } catch (error) {
        console.error("Error loading settings: ", error);
      }
    };
    loadRewards();
  }, []);

  const handleToggleFinalize = async () => {
    const newState = !winnersFinalized;
    try {
      await setWinnersFinalized(newState);
      setFinalized(newState);
      showToast(newState ? "🏆 Winners finalized! Students can now claim rewards." : "🔓 Winners unfinalized.", "success");
    } catch (error) {
      showToast("Failed to update status", "error");
    }
  };

  const handleSaveRewards = async () => {
    try {
      await setRewards(firstPlace, secondPlace, thirdPlace);
      showToast(" Rewards updated successfully!", "success");
    } catch (e: any) {
      showToast(` ${e.message}`, "error");
    }
  };

  const handleExportCSV = async () => {
    try {
      console.log('CSV export started');
      const snapshot = await getDocs(collection(db, 'monthlyResults'));
      if (snapshot.empty) {
        showToast('📥 No monthly results to export', 'info');
        return;
      }

      const rows: Array<{ name: string; team: string; points: number; rank: number }> = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        if (Array.isArray(d?.leaderboard)) {
          d.leaderboard.forEach((entry: any, idx: number) => {
            rows.push({
              name: String(entry?.name ?? 'Unknown'),
              team: String(entry?.teamName ?? entry?.team ?? ''),
              points: Number(entry?.points ?? 0),
              rank: Number(entry?.rank ?? idx + 1),
            });
          });
        }
      });

      await exportMonthlyCSV(rows);
      showToast('📥 Report exported!', 'success');
    } catch (e: any) {
      console.error('Export error:', e);
      showToast(`❌ Export failed: ${e?.message || 'Unknown error'}`, 'error');
    }
  };

const exportMonthlyCSV = async (data: Array<{ name: string; team: string; points: number; rank: number }>) => {
  try {
    console.log('Preparing CSV with rows:', data.length);

    const header = 'Name,Team,Points,Rank\r\n';

    const escapeCsv = (value: string | number) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const body = data
      .map((row) => [
        escapeCsv(row.name),
        escapeCsv(row.team),
        escapeCsv(row.points),
        escapeCsv(row.rank),
      ].join(','))
      .join('\r\n');

    const csv = `${header}${body}${body ? '\r\n' : ''}`;

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'monthly_results.csv';
      link.click();

      console.log('CSV downloaded on web');
      URL.revokeObjectURL(url);
      return;
    }

    const fileUri =
      FileSystem.documentDirectory
        ? `${FileSystem.documentDirectory}monthly_results.csv`
        : FileSystem.cacheDirectory
        ? `${FileSystem.cacheDirectory}monthly_results.csv`
        : null;

    if (!fileUri) {
      throw new Error('No valid file directory available');
    }

    console.log('Writing CSV to:', fileUri);
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

    console.log('Opening share sheet for CSV');
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Monthly Results',
      UTI: 'public.comma-separated-values-text',
    });
  } catch (error: any) {
    console.error('exportMonthlyCSV failed:', error);
    throw error;
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
    <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.ambientGlow} />
      <View style={styles.ambientGlow2} />

      <SafeAreaView edges={['top']} style={{ paddingHorizontal: SPACING.lg }}>
        <View style={styles.brandRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Logo size={32} />
            <Text style={styles.brandTitle}>Settings</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
        {/* PROFILE SECTION */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-cog" size={22} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>Profile</Text>
        </View>
        <View style={styles.glassCard}>
          <View style={styles.accountRow}>
            <View style={styles.avatarContainer}>
              <AppAvatar user={user} size={80} />
            </View>
            <View style={{alignItems: 'center', marginBottom: SPACING.lg}}>
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
        </View>

        {/* REWARDS CONFIG */}
        <View style={[styles.sectionHeader, {marginTop: SPACING.xl}]}>
          <MaterialCommunityIcons name="gift" size={22} color={COLORS.link} />
          <Text style={styles.sectionTitle}>Monthly Rewards</Text>
        </View>
        <View style={styles.glassCard}>
          <View style={styles.rewardInputRow}>
            <Text style={styles.rankIcon}>🥇</Text>
            <TextInput 
              style={styles.glassInput} 
              placeholderTextColor={COLORS.muted}
              placeholder="1st Place Reward" 
              value={firstPlace} 
              onChangeText={setFirstPlace} 
            />
          </View>

          <View style={styles.rewardInputRow}>
            <Text style={styles.rankIcon}>🥈</Text>
            <TextInput 
              style={styles.glassInput} 
              placeholderTextColor={COLORS.muted}
              placeholder="2nd Place Reward" 
              value={secondPlace} 
              onChangeText={setSecondPlace} 
            />
          </View>

          <View style={styles.rewardInputRow}>
            <Text style={styles.rankIcon}>🥉</Text>
            <TextInput 
              style={styles.glassInput} 
              placeholderTextColor={COLORS.muted}
              placeholder="3rd Place Reward" 
              value={thirdPlace} 
              onChangeText={setThirdPlace} 
            />
          </View>

          <Button title="Save Rewards" onPress={handleSaveRewards} style={{ marginTop: SPACING.sm }} />
          
          <View style={{ marginTop: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.glassBorder, paddingTop: SPACING.lg }}>
            <Text style={[styles.helpText, { marginBottom: SPACING.md }]}>
              Finalizing winners will allow students in the top 3 to claim their rewards. Use this at the end of the month before resetting.
            </Text>
            <Button 
              title={winnersFinalized ? "🔓 Unfinalize Winners" : "🏆 Finalize Winners"} 
              variant={winnersFinalized ? "secondary" : "primary"}
              onPress={handleToggleFinalize} 
            />
          </View>
        </View>

        {/* EXPORT SECTION */}
        <View style={[styles.sectionHeader, {marginTop: SPACING.xl}]}>
          <MaterialCommunityIcons name="download" size={22} color={COLORS.success} />
          <Text style={styles.sectionTitle}>Data Export</Text>
        </View>
        <View style={styles.glassCard}>
          <Text style={styles.helpText}>
            Download the monthly leaderboard results as a CSV file. Share it with your team or keep it for records.
          </Text>
          <Button title="📥 Download Monthly Report" variant="secondary" onPress={handleExportCSV} />
        </View>

        {/* DANGER ZONE */}
        <View style={[styles.sectionHeader, {marginTop: SPACING.xl}]}>
          <MaterialCommunityIcons name="alert-octagon" size={22} color={COLORS.error} />
          <Text style={[styles.sectionTitle, { color: COLORS.error }]}>Danger Zone</Text>
        </View>
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Leaderboard Reset</Text>
          <Text style={styles.helpText}>
            This will safely archive the current standing and RESET every student's active points down to zero for the start of a new month.
          </Text>
          <Button title="Reset Month" variant="danger" onPress={handleResetMonth} />
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.glowPrimary,
    opacity: 0.08,
  },
  ambientGlow2: {
    position: 'absolute',
    bottom: 200,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.glowAccent,
    opacity: 0.06,
  },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl * 2 },
  
  // Brand
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  brandTitle: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 22,
    marginLeft: 12,
    letterSpacing: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  
  // Glass cards
  glassCard: {
    backgroundColor: COLORS.glassBackgroundLv1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 6,
  },
  dangerCard: {
    backgroundColor: 'rgba(229, 62, 62, 0.08)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.25)',
    marginBottom: SPACING.md,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  
  // Profile
  accountRow: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  
  // Inputs
  glassInput: {
    flex: 1,
    backgroundColor: COLORS.glassBackgroundLv3,
    color: COLORS.textDark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
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
  
  // Common
  helpText: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
    fontSize: 14,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
});
