import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ImageModal from '../../components/ImageModal';
import { logout } from '../../services/auth';
import { useNavigation } from '@react-navigation/native';
import { observeTasks, Task } from '../../services/tasks';
import { observeStudents, observeLeaderboard, UserSchema } from '../../services/users';
import { observePendingSubmissions, approveSubmission, rejectSubmission, Submission } from '../../services/submissions';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<UserSchema[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserSchema[]>([]);

  const [selectedImage, setSelectedImage] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSubmission, setActionSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    const unsubTasks = observeTasks(setActiveTasks, true);
    const unsubStudents = observeStudents(setStudents);
    const unsubSubs = observePendingSubmissions(setPendingSubmissions);
    const unsubLead = observeLeaderboard(setLeaderboard);

    return () => {
      unsubTasks();
      unsubStudents();
      unsubSubs();
      unsubLead();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Auth');
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleApprove = async (sub: Submission) => {
    Alert.alert("Approve Submission", "Use default task points or custom?", [
      { text: "Cancel", style: "cancel" },
      { text: "Default", onPress: () => confirmApprove(sub, sub.pointsAwarded || 10) },
      // Ideally custom points prompt here, but skipping for simplicity inline
    ]);
  };

  const confirmApprove = async (sub: Submission, points: number) => {
    try {
      await approveSubmission(sub, points);
      Alert.alert("Success", "Submission approved!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleReject = (sub: Submission) => {
    setActionSubmission(sub);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return Alert.alert("Error", "Please provide a reason.");
    if (!actionSubmission) return;
    try {
      await rejectSubmission(actionSubmission, rejectReason);
      setRejectModalVisible(false);
      Alert.alert("Success", "Submission rejected.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Admin Dashboard" rightAction="Logout" onRightPress={handleLogout} />
      <ScreenWrapper>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* DASHBOARD STATS */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pendingSubmissions.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{students.length}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{activeTasks.length}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Manage', { screen: 'Tasks' })}>
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionText}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Manage', { screen: 'Announcements' })}>
              <MaterialCommunityIcons name="bullhorn-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionText}>Announce</Text>
            </TouchableOpacity>
          </View>

          {/* VERIFICATION QUEUE */}
          <View style={styles.section}>
            <Text style={TYPOGRAPHY.heading}>Verification Queue</Text>
            {pendingSubmissions.length === 0 ? (
              <Text style={styles.emptyText}>No pending submissions! 🎉</Text>
            ) : (
              pendingSubmissions.map((sub,index) => (
                                                                  
                <Card key={`${sub.id}-${index}`} style={styles.submissionCard}>
                  
                  <View style={styles.subHeader}>
                    <Text style={styles.subTitle}>{sub.title}</Text>
                    <Badge label="Pending" backgroundColor="#FFF3CD" textColor="#856404" />
                  </View>
                  
                  <Text style={styles.subDesc}>{sub.description}</Text>
                  {sub.notes ? <Text style={styles.subNotes}>Note: {sub.notes}</Text> : null}

                  {sub.photoUrl ? (
                    <TouchableOpacity onPress={() => setSelectedImage(sub.photoUrl)}>
                      <Image source={{ uri: sub.photoUrl }} style={styles.subImage} />
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleReject(sub)}>
                      <Text style={styles.btnTextReject}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => handleApprove(sub)}>
                      <Text style={styles.btnTextApprove}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>

          {/* LEADERBOARD */}
          <View style={[styles.section, { paddingBottom: 60 }]}>
            <Text style={TYPOGRAPHY.heading}>Top Leaderboard</Text>
            {leaderboard.slice(0, 3).map((student, index) => (
              <View key={`${student.id || student.uid}-${index}`} style={styles.leaderboardRow}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <View style={styles.leadInfo}>
                  <Text style={styles.leadName}>{student.name}</Text>
                  <Text style={styles.leadRoom}>Room {student.room}</Text>
                </View>
                <Text style={styles.leadPoints}>{student.pointsThisMonth} pts</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </ScreenWrapper>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={TYPOGRAPHY.heading}>Reject Reason</Text>
            <TextInput
              style={styles.input}
              placeholder="Why is it rejected?"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="secondary" onPress={() => setRejectModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Confirm" onPress={confirmReject} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Modal */}
      <ImageModal 
        visible={!!selectedImage} 
        imageUrl={selectedImage} 
        onClose={() => setSelectedImage('')} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xl },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    flex: 1,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.card,
  },
  actionText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  emptyText: {
    color: COLORS.mutedText,
    fontStyle: 'italic',
    marginTop: SPACING.md,
  },
  submissionCard: {
    marginTop: SPACING.md,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    flex: 1,
  },
  subDesc: {
    color: '#666',
    marginBottom: SPACING.sm,
  },
  subNotes: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
    backgroundColor: '#f5f5f5',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  subImage: {
    width: '100%',
    height: 150,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  btn: {
    flex: 1,
    padding: Math.max(SPACING.sm, 10),
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnReject: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF',
  },
  btnApprove: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success,
  },
  btnTextReject: {
    color: COLORS.error,
    fontWeight: '600',
  },
  btnTextApprove: {
    color: '#FFF',
    fontWeight: '600',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    ...SHADOWS.card,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    width: 40,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  leadRoom: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  leadPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    ...SHADOWS.card,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  }
});
