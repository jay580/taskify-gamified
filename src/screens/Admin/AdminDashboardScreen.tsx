import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING } from '../../theme';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import { logout } from '../../services/auth';
import { useNavigation } from '@react-navigation/native';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Auth');
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Admin Dashboard" rightAction="Logout" onRightPress={handleLogout} />
      <ScreenWrapper>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Welcome back, Admin</Text>
          
          <View style={styles.statsContainer}>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Total Users</Text>
              <Text style={styles.cardValue}>1,234</Text>
            </Card>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Pending Submissions</Text>
              <Text style={styles.cardValue}>42</Text>
            </Card>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Active Tasks</Text>
              <Text style={styles.cardValue}>15</Text>
            </Card>
          </View>
        </ScrollView>
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xl },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark, marginBottom: SPACING.xl },
  statsContainer: { gap: SPACING.md },
  card: { padding: SPACING.lg, alignItems: 'center' },
  cardTitle: { fontSize: 16, color: COLORS.mutedText, marginBottom: SPACING.xs },
  cardValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary }
});
