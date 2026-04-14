import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SPACING, RADIUS } from '../../theme';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { createTask, TaskPoints } from '../../services/tasks';
import type { TaskDurationType } from '../../utils/taskStatus';

const POINTS_OPTIONS: TaskPoints[] = [5, 10, 15, 20];

export default function TaskManagerScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<TaskPoints>(5);
  const [duration, setDuration] = useState('1');
  const [durationType, setDurationType] = useState<TaskDurationType>('hours');
  const [loading, setLoading] = useState(false);

  const handleCreateTask = async () => {
    if (!title || !description) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      await createTask({ 
        title, 
        description, 
        category: 'General',
        points,
        deadline: new Date(),
        duration: Math.max(1, Number(duration) || 1),
        durationType,
        assignedTo: 'all',
        isTeamTask: false,
        isRepeatable: false,
        isActive: true
      });
      Alert.alert("Success", "Task created successfully!");
      setTitle('');
      setDescription('');
      setPoints(5);
      setDuration('1');
      setDurationType('hours');
    } catch (error) {
      Alert.alert("Error", "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <View style={styles.container}>
      <Header title="Task Manager" />
      <ScreenWrapper>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Create New Task</Text>

            <TextInput
              label="Task Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
            />

            <TextInput
              label="Task Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
            />

            <Text style={styles.label}>Points per completion</Text>
            <View style={styles.pointsContainer}>
              {POINTS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.pointChip,
                    points === opt && styles.pointChipActive
                  ]}
                  onPress={() => setPoints(opt)}
                >
                  <Text style={[
                    styles.pointText,
                    points === opt && styles.pointTextActive
                  ]}>
                    {opt} pts
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Task Duration</Text>
            <View style={styles.durationRow}>
              <TextInput
                label="Duration"
                value={duration}
                onChangeText={setDuration}
                mode="outlined"
                keyboardType="number-pad"
                style={[styles.input, styles.durationInput]}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
              />
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={durationType}
                  onValueChange={(value) => setDurationType(value as TaskDurationType)}
                  style={styles.picker}
                  dropdownIconColor={COLORS.textDark}
                >
                  <Picker.Item label="Minutes" value="minutes" />
                  <Picker.Item label="Hours" value="hours" />
                  <Picker.Item label="Days" value="days" />
                </Picker>
              </View>
            </View>

            <Button
              title={loading ? "Creating..." : "Create Task"}
              onPress={handleCreateTask}
              variant="primary"
            />
          </Card>
        </ScrollView>
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xl },
  formCard: { padding: SPACING.lg },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark, marginBottom: SPACING.lg },
  input: { marginBottom: SPACING.md, backgroundColor: COLORS.surface },
  textArea: { minHeight: 100 },
  label: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginBottom: SPACING.sm, marginTop: SPACING.sm },
  pointsContainer: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl, flexWrap: 'wrap' },
  durationRow: { marginBottom: SPACING.lg },
  durationInput: { marginBottom: SPACING.sm },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  picker: { color: COLORS.textDark },
  pointChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pointChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pointText: { color: COLORS.text, fontWeight: '500' },
  pointTextActive: { color: COLORS.white },
});
