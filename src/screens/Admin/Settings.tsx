import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { setRewards, resetMonth } from '../../services/settings';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function SettingsScreen() {
  const [firstPlace, setFirstPlace] = useState('');
  const [secondPlace, setSecondPlace] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');

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
      Alert.alert("Success", "Rewards updated!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
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
              Alert.alert("Success", "Month reset successfully! All points are now 0.");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" />
      <ScreenWrapper>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* REWARDS CONFIG */}
          <Text style={styles.sectionTitle}>Monthly Rewards</Text>
          <Card style={styles.formCard}>
            <Text style={styles.label}>1st Place Reward</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Free Pizza" 
              value={firstPlace} 
              onChangeText={setFirstPlace} 
            />

            <Text style={styles.label}>2nd Place Reward</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. No Homework Pass" 
              value={secondPlace} 
              onChangeText={setSecondPlace} 
            />

            <Text style={styles.label}>3rd Place Reward</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 5 Extra Credit Points" 
              value={thirdPlace} 
              onChangeText={setThirdPlace} 
            />

            <Button title="Save Rewards" onPress={handleSaveRewards} style={{ marginTop: SPACING.md }} />
          </Card>

          {/* DANGER ZONE: MONTH RESET */}
          <Text style={[styles.sectionTitle, { marginTop: SPACING.xl, color: COLORS.error }]}>Danger Zone</Text>
          <Card style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Monthly Leaderboard Reset</Text>
            <Text style={styles.dangerDesc}>
              Using this button will take a snapshot of the current leaderboard and archive it in the monthly history. 
              After archiving, ALL student points for the current month will be reset to zero.
            </Text>
            
            <TouchableOpacity style={styles.destroyBtn} onPress={handleResetMonth}>
              <Text style={styles.destroyBtnText}>RESET MONTH</Text>
            </TouchableOpacity>
          </Card>

        </ScrollView>
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xl * 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: SPACING.md,
  },
  formCard: {
    padding: SPACING.lg,
  },
  label: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dangerCard: {
    padding: SPACING.lg,
    borderColor: COLORS.error,
    borderWidth: 1.5,
    backgroundColor: '#fff0f0',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  dangerDesc: {
    color: '#888',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  destroyBtn: {
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  destroyBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
