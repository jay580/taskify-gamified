import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS } from '../../theme';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { observePendingSubmissions, approveSubmission, rejectSubmission, Submission } from '../../services/submissions';

export default function VerificationScreen() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = observePendingSubmissions((data) => {
      setSubmissions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (sub: Submission) => {
    try {
      await approveSubmission(sub, sub.pointsAwarded || 10);
      Alert.alert("Approved", "Submission approved and points awarded.");
    } catch (error) {
      Alert.alert("Error", "Failed to approve.");
    }
  };

  const handleReject = async (sub: Submission) => {
    try {
      await rejectSubmission(sub, "Rejected by admin");
      Alert.alert("Rejected", "Submission has been rejected.");
    } catch (error) {
      Alert.alert("Error", "Failed to reject.");
    }
  };


  return (
    <View style={styles.container}>
      <Header title="Verifications" />
      <ScreenWrapper>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {submissions.length === 0 ? (
              <Text style={styles.emptyText}>No pending submissions</Text>
            ) : (
              submissions.map((sub) => (
                <Card key={sub.id} style={styles.card}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Image Proof</Text>
                  </View>
                  
                  <View style={styles.cardHeader}>
                    <Text style={styles.title}>{sub.title || 'Task Submission'}</Text>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>+{sub.pointsAwarded} pts</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.description}>{sub.description || 'No description provided.'}</Text>
                  
                  <View style={styles.actions}>
                    <View style={{ flex: 1 }}>
                      <Button title="Reject" onPress={() => handleReject(sub)} variant="secondary" />
                    </View>
                    <View style={{ width: SPACING.md }} />
                    <View style={{ flex: 1 }}>
                      <Button title="Approve" onPress={() => handleApprove(sub)} variant="primary" />
                    </View>
                  </View>
                </Card>
              ))
            )}
          </ScrollView>
        )}
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xl },
  emptyText: { textAlign: 'center', marginTop: SPACING.xl, color: COLORS.mutedText, fontSize: 16 },
  card: { padding: SPACING.md, marginBottom: SPACING.lg },
  imagePlaceholder: {
    height: 150,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm ?? 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  imagePlaceholderText: { color: COLORS.mutedText, fontWeight: '500' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, flex: 1 },
  pointsBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 999 },
  pointsText: { color: COLORS.success, fontWeight: 'bold', fontSize: 14 },
  description: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
});
