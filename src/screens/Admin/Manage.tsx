import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import SegmentedControl from '../../components/SegmentedControl';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { createTask, observeTasks, toggleTaskActive, deleteTask, Task, TaskPoints } from '../../services/tasks';
import { createStudent, observeStudents, UserSchema } from '../../services/users';
import { saveAnnouncement } from '../../services/settings';

export default function ManageScreen() {
  const [segment, setSegment] = useState(0); // 0: Tasks, 1: Students, 2: Announcements

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
      Alert.alert("Success", "Task created.");
      setTaskTitle('');
      setTaskDesc('');
      setTaskCategory('');
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleCreateStudent = async () => {
    if (!studentName || !studentRoom) return Alert.alert("Error", "Name and Room required.");
    try {
      const creds = await createStudent(studentName, studentRoom);
      Alert.alert("Student Created!", `ID: ${creds.studentId}\nPassword: ${creds.password}\n\nPlease share these credentials securely with the student.`);
      setStudentName('');
      setStudentRoom('');
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementMsg) return Alert.alert("Error", "Message required");
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays || '7'));
      await saveAnnouncement(announcementMsg, expiryDate);
      Alert.alert("Success", "Announcement posted globally.");
      setAnnouncementMsg('');
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  // --- Renderers ---
  const renderTasksTab = () => (
    <View>
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Create New Task</Text>
        <TextInput style={styles.input} placeholder="Task Title" value={taskTitle} onChangeText={setTaskTitle} />
        <TextInput style={[styles.input, { height: 80 }]} placeholder="Description" value={taskDesc} onChangeText={setTaskDesc} multiline />
        <TextInput style={styles.input} placeholder="Category" value={taskCategory} onChangeText={setTaskCategory} />
        
        <Text style={styles.label}>Points (Strict)</Text>
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
          <Switch value={isTeamTask} onValueChange={setIsTeamTask} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Repeatable?</Text>
          <Switch value={isRepeatable} onValueChange={setIsRepeatable} />
        </View>

        <Button title="Create Task" onPress={handleCreateTask} style={{ marginTop: SPACING.md }} />
      </Card>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg, marginBottom: SPACING.md }]}>All Tasks</Text>
      {tasks.map(t => (
        <Card key={t.id} style={{ opacity: t.isActive ? 1 : 0.6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.itemTitle}>{t.title}</Text>
            <TouchableOpacity onPress={() => toggleTaskActive(t.id!, t.isActive)}>
              <Text style={{ color: t.isActive ? COLORS.error : COLORS.success, fontWeight: 'bold' }}>
                {t.isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: COLORS.mutedText }}>{t.points} pts • {t.category}</Text>
        </Card>
      ))}
    </View>
  );

  const renderStudentsTab = () => (
    <View>
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add New Student</Text>
        <TextInput style={styles.input} placeholder="Full Name" value={studentName} onChangeText={setStudentName} />
        <TextInput style={styles.input} placeholder="Room / Class" value={studentRoom} onChangeText={setStudentRoom} />
        <Text style={styles.helperText}>* Login credentials will be auto-generated and shown in an alert.</Text>
        <Button title="Register Student" onPress={handleCreateStudent} style={{ marginTop: SPACING.sm }} />
      </Card>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg, marginBottom: SPACING.md }]}>Student Roster</Text>
      {students.map(s => (
        <Card key={s.uid} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.itemTitle}>{s.name}</Text>
            <Text style={{ color: COLORS.mutedText }}>{s.studentId} • Room {s.room}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.primary }}>{s.pointsThisMonth} pts</Text>
        </Card>
      ))}
    </View>
  );

  const renderAnnouncementsTab = () => (
    <View>
      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>Global Announcement</Text>
        <TextInput 
          style={[styles.input, { height: 100 }]} 
          placeholder="Type announcement here..." 
          value={announcementMsg} 
          onChangeText={setAnnouncementMsg} 
          multiline 
        />
        <TextInput 
          style={styles.input} 
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
      <Header title="Management" />
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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xl * 3 },
  formCard: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  label: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    marginTop: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  pointBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  pointBtnActive: {
    backgroundColor: COLORS.primary,
  },
  pointText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  pointTextActive: {
    color: '#FFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.textDark,
  }
});
