import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import SegmentedControl from '../../components/SegmentedControl';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { createTask, observeTasks, toggleTaskActive, deleteTask, Task, TaskPoints } from '../../services/tasks';
import { createStudent, observeStudents, UserSchema, awardAdminPoints, updateStudentSuspension } from '../../services/users';
import { saveAnnouncement } from '../../services/settings';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToast } from '../../contexts/ToastContext';
import FadeInView from '../../components/FadeInView';

export default function ManageScreen() {
  const [segment, setSegment] = useState(0); // 0: Tasks, 1: Students, 2: Announcements
  const { showToast } = useToast();

  // === Tasks State ===
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskPoints, setTaskPoints] = useState<TaskPoints>(10);
  const [isTeamTask, setIsTeamTask] = useState(false);
  const [isRepeatable, setIsRepeatable] = useState(false);

  // === Students State ===
  const [students, setStudents] = useState<UserSchema[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentRoom, setStudentRoom] = useState('');

  // === Announcements State ===
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');

  useEffect(() => {
    const unsubTasks = observeTasks(setTasks, false);
    const unsubStudents = observeStudents(setStudents);
    return () => {
      unsubTasks();
      unsubStudents();
    };
  }, []);

  // --- Handlers ---
  const handleCreateTask = async () => {
    if (!taskTitle || !taskDesc || !taskCategory) return Alert.alert("Error", "Please fill required fields.");
    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7); // Default 7 days from now
      await createTask({
        title: taskTitle,
        description: taskDesc,
        category: taskCategory,
        points: taskPoints,
        deadline,
        assignedTo: 'all',
        isTeamTask,
        isRepeatable,
        isActive: true,
      });
      showToast("✅ Task created successfully", "success");
      setTaskTitle('');
      setTaskDesc('');
      setTaskCategory('');
    } catch (e: any) {
      showToast(`⚠️ ${e.message}`, "error");
    }
  };

  const handleCreateStudent = async () => {
    if (!studentName || !studentRoom) return Alert.alert("Error", "Name and Room required.");
    try {
      const creds = await createStudent(studentName, studentRoom);
      Alert.alert("Student Created!", `ID: ${creds.studentId}\nPassword: ${creds.password}\n\nPlease share these credentials securely with the student.`);
      showToast(" Student added successfully", "success");
      setStudentName('');
      setStudentRoom('');
    } catch (e: any) {
      showToast(` ${e.message}`, "error");
    }
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
      { text: "Confirm", onPress: () => awardAdminPoints(userId, points) }
    ]);
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
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Create New Task</Text>
        <TextInput style={styles.input} placeholderTextColor={COLORS.muted} placeholder="Task Title" value={taskTitle} onChangeText={setTaskTitle} />
        <TextInput style={[styles.input, { height: 80 }]} placeholderTextColor={COLORS.muted} placeholder="Description" value={taskDesc} onChangeText={setTaskDesc} multiline />
        <TextInput style={styles.input} placeholderTextColor={COLORS.muted} placeholder="Category" value={taskCategory} onChangeText={setTaskCategory} />
        
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

        <View style={styles.switchRow}>
          <Text style={styles.label}>Team Task?</Text>
          <Switch value={isTeamTask} onValueChange={setIsTeamTask} trackColor={{ false: COLORS.border, true: COLORS.success }} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Repeatable?</Text>
          <Switch value={isRepeatable} onValueChange={setIsRepeatable} trackColor={{ false: COLORS.border, true: COLORS.success }} />
        </View>

        <Button title="Create Task" onPress={handleCreateTask} style={{ marginTop: SPACING.md }} />
      </Card>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg, marginBottom: SPACING.md }]}>All Tasks</Text>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.itemTitle}>{t.title}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => toggleTaskActive(t.id!, t.isActive)}>
                <Text style={{ color: t.isActive ? COLORS.warning : COLORS.success, fontWeight: 'bold' }}>
                  {t.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: COLORS.mutedText, marginTop: 4 }}>{t.points} pts • {t.category}</Text>
          </Card>
          </FadeInView>
        ))
      )}
    </View>
  );

  const renderStudentsTab = () => (
    <View>
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add New Student</Text>
        <TextInput style={styles.input} placeholderTextColor={COLORS.muted} placeholder="Full Name" value={studentName} onChangeText={setStudentName} />
        <TextInput style={styles.input} placeholderTextColor={COLORS.muted} placeholder="Room / Class" value={studentRoom} onChangeText={setStudentRoom} />
        <Text style={styles.helperText}>* Login credentials will be auto-generated and shown in an alert.</Text>
        <Button title="Register Student" onPress={handleCreateStudent} style={{ marginTop: SPACING.sm }} />
      </Card>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg, marginBottom: SPACING.md }]}>Student Roster</Text>
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
                <Text style={{ color: COLORS.mutedText, marginTop: 4 }}>{s.studentId} • Room {s.room}</Text>
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
               
               <TouchableOpacity activeOpacity={0.7} style={styles.suspendBtn} onPress={() => handleToggleSuspend(s)}>
                 <MaterialCommunityIcons name={s.isSuspended ? "account-check" : "account-cancel"} size={16} color={s.isSuspended ? COLORS.success : COLORS.error} />
                 <Text style={{ color: s.isSuspended ? COLORS.success : COLORS.error, fontWeight: 'bold', marginLeft: 6 }}>
                   {s.isSuspended ? "Unsuspend Student" : "Suspend Student"}
                 </Text>
               </TouchableOpacity>
            </View>
          </Card>
          </FadeInView>
        ))
      )}
    </View>
  );

  const renderAnnouncementsTab = () => (
    <View>
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Global Announcement</Text>
        <TextInput 
          style={[styles.input, { height: 100 }]} 
          placeholderTextColor={COLORS.muted}
          placeholder="Type announcement here..." 
          value={announcementMsg} 
          onChangeText={setAnnouncementMsg} 
          multiline 
        />
        <TextInput 
          style={styles.input} 
          placeholderTextColor={COLORS.muted}
          placeholder="Expiry (Days)" 
          value={expiryDays} 
          onChangeText={setExpiryDays} 
          keyboardType="numeric" 
        />
        <Button title="Post Announcement" onPress={handlePostAnnouncement} style={{ marginTop: SPACING.sm }} />
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <ScreenWrapper>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <SegmentedControl 
            options={["Tasks", "Students", "Announcements"]} 
            selectedIndex={segment} 
            onChange={setSegment} 
          />
          {segment === 0 && renderTasksTab()}
          {segment === 1 && renderStudentsTab()}
          {segment === 2 && renderAnnouncementsTab()}
        </ScrollView>
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  content: { paddingBottom: SPACING.xl * 3 },
  formCard: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    color: COLORS.textDark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#3B4A6B',
    fontSize: 16,
  },
  label: {
    fontWeight: '700',
    color: COLORS.mutedText,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  labelSmall: {
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 8,
    fontSize: 11,
    textTransform: 'uppercase',
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
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
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
    color: COLORS.textDark,
  },
  studentActionContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickPtsBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  suspendBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: COLORS.mutedText,
    fontSize: 16,
    fontWeight: '600',
    marginTop: SPACING.sm,
  }
});
