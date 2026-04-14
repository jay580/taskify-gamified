import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import SegmentedControl from '../../components/SegmentedControl';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Logo from '../../components/Logo';
import { createTask, observeTasks, toggleTaskActive, deleteTask, Task, TaskPoints } from '../../services/tasks';
import { createStudent, observeStudents, UserSchema, awardAdminPoints, updateStudentSuspension, deleteStudent } from '../../services/users';
import { observeTeams, giftPointsToTeam, TeamSchema } from '../../services/teams';
import { saveAnnouncement } from '../../services/settings';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToast } from '../../contexts/ToastContext';
import FadeInView from '../../components/FadeInView';
import * as Clipboard from 'expo-clipboard';
import { getTaskStatus, getTaskStatusLabel, TaskDurationType } from '../../utils/taskStatus';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManageScreen() {
  const [segment, setSegment] = useState(0); // 0: Tasks, 1: Students, 2: Teams, 3: Announcements
  const { showToast } = useToast();

  // === Tasks State ===
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskPoints, setTaskPoints] = useState<TaskPoints>(10);
  const [isTeamTask, setIsTeamTask] = useState(false);
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [taskDuration, setTaskDuration] = useState('1');
  const [taskDurationType, setTaskDurationType] = useState<TaskDurationType>('hours');

  // === Students State ===
  const [students, setStudents] = useState<UserSchema[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentTeam, setStudentTeam] = useState('');
  const [studentDOB, setStudentDOB] = useState('');

  // === Teams State ===
  const [teams, setTeams] = useState<TeamSchema[]>([]);

  // === Announcements State ===
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');

  // === Credential Modal ===
  const [credModalVisible, setCredModalVisible] = useState(false);
  const [createdCreds, setCreatedCreds] = useState({ studentId: '', email: '', password: '' });
  const [loadingStudent, setLoadingStudent] = useState(false);

  useEffect(() => {
    const unsubTasks = observeTasks(setTasks, false);
    const unsubStudents = observeStudents(setStudents);
    const unsubTeams = observeTeams(setTeams);
    return () => {
      unsubTasks();
      unsubStudents();
      unsubTeams();
    };
  }, []);

  // --- Handlers ---
  const handleCreateTask = async () => {
    if (!taskTitle || !taskDesc || !taskCategory) return Alert.alert("Error", "Please fill required fields.");
    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      await createTask({
        title: taskTitle,
        description: taskDesc,
        category: taskCategory,
        points: taskPoints,
        deadline,
        duration: Math.max(1, Number(taskDuration) || 1),
        durationType: taskDurationType,
        assignedTo: 'all',
        isTeamTask,
        isRepeatable,
        isActive: true,
      });
      showToast("✅ Task created successfully", "success");
      setTaskTitle('');
      setTaskDesc('');
      setTaskCategory('');
      setTaskDuration('1');
      setTaskDurationType('hours');
    } catch (e: any) {
      showToast(`⚠️ ${e.message}`, "error");
    }
  };

  const handleCreateStudent = async () => {
    if (!studentName || !studentTeam || !studentDOB) return Alert.alert("Error", "Name, Team and Date of Birth required.");
    setLoadingStudent(true);
    try {
      const creds = await createStudent(studentName, studentTeam, studentDOB);
      setCreatedCreds(creds);
      setCredModalVisible(true);
      showToast("🎉 Student added successfully", "success");
      setStudentName('');
      setStudentTeam('');
      setStudentDOB('');
    } catch (e: any) {
      showToast(`❌ ${e.message}`, "error");
    } finally {
      setLoadingStudent(false);
    }
  };

  const handleCopyCredentials = async () => {
    const text = `Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`;
    await Clipboard.setStringAsync(text);
    showToast("📋 Credentials copied!", "success");
  };

  const handlePostAnnouncement = async () => {
    if (!announcementMsg) return showToast("⚠️ Message required", "error");
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays || '7'));
      await saveAnnouncement(announcementMsg, expiryDate);
      showToast("📣 Announcement posted globally", "success");
      setAnnouncementMsg('');
    } catch (e: any) {
      showToast(`⚠️ ${e.message}`, "error");
    }
  };

  const handleAwardPoints = (userId: string, points: number) => {
    Alert.alert("Award Points", `Give ${points} points?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: async () => {
        try {
          await awardAdminPoints(userId, points);
          showToast(`🔥 +${points} points awarded`, "success");
        } catch (e: any) {
          showToast(`⚠️ ${e.message}`, "error");
        }
      }}
    ]);
  };

  const handleGiftTeamPoints = (team: TeamSchema, points: number) => {
    Alert.alert("Gift Points to Team", `Give +${points} to ${team.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: async () => {
        try {
          await giftPointsToTeam(team.id, points);
          showToast(`🔥 +${points} points added to ${team.name}`, "success");
        } catch (e: any) {
          showToast(`⚠️ ${e.message}`, "error");
        }
      }}
    ]);
  };

  const handleDeleteStudent = (student: UserSchema) => {
    Alert.alert(
      "Remove Student",
      `Are you sure you want to permanently remove ${student.name}? This will delete their account entirely.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteStudent(student.uid, student.teamId, student.email, student.studentId);
              showToast("🗑️ Student removed", "success");
            } catch (e: any) {
              showToast(`⚠️ ${e.message}`, "error");
            }
          }
        }
      ]
    );
  };
  
  const handleToggleSuspend = (student: UserSchema) => {
    if (student.isSuspended) {
      Alert.alert("Unsuspend", `Lift suspension for ${student.name}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Unsuspend", onPress: () => updateStudentSuspension(student.uid, null) }
      ]);
    } else {
      Alert.alert("Suspend Student", `Suspend ${student.name} for how long?`, [
        { text: "Cancel", style: "cancel" },
        { text: "3 Days", onPress: () => updateStudentSuspension(student.uid, 3), style: "destructive" },
        { text: "7 Days", onPress: () => updateStudentSuspension(student.uid, 7), style: "destructive" },
      ]);
    }
  };

  // --- Renderers ---
  const renderTasksTab = () => (
    <View>
      <View style={styles.glassFormCard}>
        <Text style={styles.sectionTitle}>Create New Task</Text>
        <TextInput style={styles.glassInput} placeholderTextColor={COLORS.muted} placeholder="Task Title" value={taskTitle} onChangeText={setTaskTitle} />
        <TextInput style={[styles.glassInput, { height: 80 }]} placeholderTextColor={COLORS.muted} placeholder="Description" value={taskDesc} onChangeText={setTaskDesc} multiline />
        <TextInput style={styles.glassInput} placeholderTextColor={COLORS.muted} placeholder="Category (Academic, Domestic, Sports, Special)" value={taskCategory} onChangeText={setTaskCategory} />
        
        <Text style={styles.label}>Points Amount</Text>
        <View style={styles.pointsRow}>
          {[5, 10, 15, 20].map((val) => (
            <TouchableOpacity 
              key={val} 
              style={[styles.pointBtn, taskPoints === val && styles.pointBtnActive]}
              onPress={() => setTaskPoints(val as TaskPoints)}
            >
              <Text style={[styles.pointText, taskPoints === val && styles.pointTextActive]}>{val}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Task Duration</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: SPACING.md }}>
          <TextInput
            style={[styles.glassInput, { flex: 1, marginBottom: 0 }]}
            placeholderTextColor={COLORS.muted}
            placeholder="Duration"
            value={taskDuration}
            onChangeText={setTaskDuration}
            keyboardType="number-pad"
          />
          <View style={[styles.glassInput, { flex: 1, marginBottom: 0, padding: 0, justifyContent: 'center' }]}>
            <Picker
              selectedValue={taskDurationType}
              onValueChange={(value) => setTaskDurationType(value as TaskDurationType)}
              style={{ color: COLORS.textDark }}
              dropdownIconColor={COLORS.textDark}
            >
              <Picker.Item label="Minutes" value="minutes" />
              <Picker.Item label="Hours" value="hours" />
              <Picker.Item label="Days" value="days" />
            </Picker>
          </View>
        </View>

        <View style={styles.glassSwitch}>
          <Text style={styles.switchLabel}>Team Task?</Text>
          <Switch value={isTeamTask} onValueChange={setIsTeamTask} trackColor={{ false: COLORS.border, true: COLORS.success }} thumbColor={COLORS.white} />
        </View>
        <View style={styles.glassSwitch}>
          <Text style={styles.switchLabel}>Repeatable?</Text>
          <Switch value={isRepeatable} onValueChange={setIsRepeatable} trackColor={{ false: COLORS.border, true: COLORS.success }} thumbColor={COLORS.white} />
        </View>

        <Button title="Create Task" onPress={handleCreateTask} style={{ marginTop: SPACING.md }} />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>All Tasks</Text>
      {tasks.length === 0 ? (
        <FadeInView delay={100}>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-off" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No tasks created yet.</Text>
          </View>
        </FadeInView>
      ) : (
        tasks.map((t, index) => (
          <FadeInView key={t.id || index.toString()} delay={index * 50}>
            <Card style={{ opacity: t.isActive ? 1 : 0.6 }}>
            {(() => {
              const status = getTaskStatus({
                createdAt: t.createdAt ?? null,
                duration: t.duration,
                durationType: t.durationType,
              });
              const statusLabel = getTaskStatusLabel({
                createdAt: t.createdAt ?? null,
                duration: t.duration,
                durationType: t.durationType,
              });
              return (
                <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.itemTitle}>{t.title}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => toggleTaskActive(t.id!, t.isActive)}>
                <Text style={{ color: t.isActive ? COLORS.warning : COLORS.success, fontWeight: 'bold' }}>
                  {t.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: COLORS.mutedText, marginTop: 4 }}>{t.points} pts • {t.category}</Text>
            <Text style={{ color: status === 'expired' ? COLORS.error : COLORS.link, marginTop: 4, fontSize: 12 }}>
              {statusLabel || `⏳ ${t.duration || 0} ${t.durationType || 'hours'}`}
            </Text>
                </>
              );
            })()}
          </Card>
          </FadeInView>
        ))
      )}
    </View>
  );

  const renderStudentsTab = () => (
    <View>
      <View style={styles.glassFormCard}>
        <Text style={styles.sectionTitle}>Add New Student</Text>
        <TextInput style={styles.glassInput} placeholderTextColor={COLORS.muted} placeholder="Full Name" value={studentName} onChangeText={setStudentName} />
        <TextInput style={styles.glassInput} placeholderTextColor={COLORS.muted} placeholder="Team Name (e.g., Alpha)" value={studentTeam} onChangeText={setStudentTeam} />
        <TextInput style={styles.glassInput} placeholderTextColor={COLORS.muted} placeholder="Date of Birth (YYYY-MM-DD)" value={studentDOB} onChangeText={setStudentDOB} />
        <Text style={styles.helperText}>* Login credentials will be auto-generated and shown in a modal.</Text>
        <Button loading={loadingStudent} disabled={loadingStudent} title={loadingStudent ? "Registering..." : "Register Student"} onPress={handleCreateStudent} style={{ marginTop: SPACING.sm }} />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Student Roster</Text>
      {students.length === 0 ? (
        <FadeInView delay={100}>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No students added yet.</Text>
          </View>
        </FadeInView>
      ) : (
        students.map((s, index) => (
          <FadeInView key={s.uid || index.toString()} delay={index * 50}>
            <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.itemTitle}>{s.name}</Text>
                  {s.isSuspended && <Badge label="SUSPENDED" backgroundColor={COLORS.error} textColor={COLORS.white} />}
                </View>
                <Text style={{ color: COLORS.mutedText, marginTop: 4 }}>{s.studentId} • {s.teamName ? `Team ${s.teamName}` : 'No Team'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.accent }}>{s.pointsThisMonth} pts</Text>
              </View>
            </View>
            
            <View style={styles.studentActionContainer}>
               <Text style={styles.labelSmall}>Quick Reward</Text>
               <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
                 {[5, 10, 15, 20].map((pts) => (
                   <TouchableOpacity activeOpacity={0.7} key={pts} style={styles.quickPtsBtn} onPress={() => handleAwardPoints(s.uid, pts)}>
                     <Text style={{color: COLORS.white, fontWeight: 'bold'}}>+{pts}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
               
               <View style={{ flexDirection: 'row', gap: 8 }}>
                 <TouchableOpacity activeOpacity={0.7} style={[styles.glassActionBtn, { flex: 1 }]} onPress={() => handleToggleSuspend(s)}>
                   <MaterialCommunityIcons name={s.isSuspended ? "account-check" : "account-cancel"} size={16} color={s.isSuspended ? COLORS.success : COLORS.error} />
                   <Text style={{ color: s.isSuspended ? COLORS.success : COLORS.error, fontWeight: 'bold', marginLeft: 6, fontSize: 12 }}>
                     {s.isSuspended ? "Unsuspend" : "Suspend"}
                   </Text>
                 </TouchableOpacity>
                 <TouchableOpacity activeOpacity={0.7} style={[styles.glassActionBtn, { flex: 1, borderColor: 'rgba(229, 62, 62, 0.3)' }]} onPress={() => handleDeleteStudent(s)}>
                   <MaterialCommunityIcons name="account-remove" size={16} color={COLORS.error} />
                   <Text style={{ color: COLORS.error, fontWeight: 'bold', marginLeft: 6, fontSize: 12 }}>Remove</Text>
                 </TouchableOpacity>
               </View>
            </View>
          </Card>
          </FadeInView>
        ))
      )}
    </View>
  );

  const renderTeamsTab = () => (
    <View>
      <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>All Teams</Text>
      {teams.length === 0 ? (
        <FadeInView delay={100}>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No teams yet. Teams are created when you add students.</Text>
          </View>
        </FadeInView>
      ) : (
        teams.map((team, index) => (
          <FadeInView key={team.id || index.toString()} delay={index * 80}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={styles.itemTitle}>{team.name}</Text>
                  <Text style={{ color: COLORS.mutedText, marginTop: 4 }}>
                    {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.accent }}>{team.totalPoints} pts</Text>
              </View>

              <View style={styles.studentActionContainer}>
                <Text style={styles.labelSmall}>Gift Team Points</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[5, 10, 15, 20].map((pts) => (
                    <TouchableOpacity activeOpacity={0.7} key={pts} style={styles.quickPtsBtn} onPress={() => handleGiftTeamPoints(team, pts)}>
                      <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>+{pts}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Card>
          </FadeInView>
        ))
      )}
    </View>
  );

  const renderAnnouncementsTab = () => (
    <View>
      <View style={styles.glassFormCard}>
        <Text style={styles.sectionTitle}>Global Announcement</Text>
        <TextInput 
          style={[styles.glassInput, { height: 100 }]} 
          placeholderTextColor={COLORS.muted}
          placeholder="Type announcement here..." 
          value={announcementMsg} 
          onChangeText={setAnnouncementMsg} 
          multiline 
        />
        <TextInput 
          style={styles.glassInput} 
          placeholderTextColor={COLORS.muted}
          placeholder="Expiry (Days)" 
          value={expiryDays} 
          onChangeText={setExpiryDays} 
          keyboardType="numeric" 
        />
        <Button title="Post Announcement" onPress={handlePostAnnouncement} style={{ marginTop: SPACING.sm }} />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.ambientGlow} />
      
      <SafeAreaView edges={['top']} style={{ paddingHorizontal: SPACING.lg }}>
        {/* Brand header */}
        <View style={styles.brandRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Logo size={32} />
            <Text style={styles.brandTitle}>Manage</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SegmentedControl 
          options={["Tasks", "Students", "Teams", "Announce"]} 
          selectedIndex={segment} 
          onChange={setSegment} 
        />
        {segment === 0 && renderTasksTab()}
        {segment === 1 && renderStudentsTab()}
        {segment === 2 && renderTeamsTab()}
        {segment === 3 && renderAnnouncementsTab()}
      </ScrollView>

      {/* Credentials Modal */}
      <Modal visible={credModalVisible} animationType="fade" transparent onRequestClose={() => setCredModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.credCard}>
            <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: SPACING.md }}>🎉</Text>
            <Text style={styles.credTitle}>Student Created!</Text>
            
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>Student ID</Text>
              <Text style={styles.credValue}>{createdCreds.studentId}</Text>
            </View>
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>Email</Text>
              <Text style={styles.credValue}>{createdCreds.email}</Text>
            </View>
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>Password</Text>
              <Text style={styles.credValue}>{createdCreds.password}</Text>
            </View>

            <Button title="📋 Copy Credentials" onPress={handleCopyCredentials} style={{ marginTop: SPACING.lg }} />
            <Button title="Done" variant="secondary" onPress={() => setCredModalVisible(false)} style={{ marginTop: SPACING.sm }} />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: COLORS.glowAccent,
    opacity: 0.08,
  },
  content: { paddingBottom: SPACING.xl * 4, paddingHorizontal: SPACING.lg },
  
  // Brand
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  brandTitle: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 22,
    marginLeft: 12,
    letterSpacing: 1,
  },
  
  // Glass form cards
  glassFormCard: {
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
  glassInput: {
    backgroundColor: COLORS.glassBackgroundLv3,
    color: COLORS.textDark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    fontSize: 16,
  },
  glassSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.glassBackgroundLv3,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  switchLabel: {
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  glassActionBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassBackgroundLv3,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
  },
  label: {
    fontWeight: '700',
    color: COLORS.mutedText,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 8,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  pointBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.glassBackgroundLv3,
  },
  pointBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pointText: {
    color: COLORS.textDark,
    fontWeight: '800',
    fontSize: 16,
  },
  pointTextActive: {
    color: COLORS.black,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.warning,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  itemTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: COLORS.white,
  },
  studentActionContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  quickPtsBtn: {
    flex: 1,
    backgroundColor: 'rgba(72, 187, 120, 0.2)',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(72, 187, 120, 0.3)',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassBackgroundLv3,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: COLORS.mutedText,
    fontSize: 16,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  // Credential Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  credCard: {
    backgroundColor: COLORS.glassBackgroundLv1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  credTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  credLabel: {
    color: COLORS.mutedText,
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credValue: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 16,
  },
});
