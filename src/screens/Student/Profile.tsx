import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Mock Data
const USER_PROFILE = {
  name: 'Aryan Sharma',
  email: 'aryan.sharma@boardingschool.edu',
  level: 12,
  totalTasks: 47,
  totalPoints: 1250,
  joinDate: 'Aug 2025'
};

const PAST_TASKS = [
  { id: '1', title: 'Library assignment log', category: 'Academic', date: 'Apr 6', points: 50, icon: 'book-outline', iconColor: '#1976D2', status: 'Approved', statusColor: '#4CAF50' },
  { id: '2', title: 'Morning room cleanup', category: 'Domestic', date: 'Apr 5', points: 30, icon: 'broom', iconColor: '#388E3C', status: 'Approved', statusColor: '#4CAF50' },
  { id: '3', title: 'Math tutorial', category: 'Academic', date: 'Mar 28', points: 60, icon: 'calculator', iconColor: '#1976D2', status: 'Rejected', statusColor: '#F44336' },
  { id: '4', title: 'Hostel Night Guard', category: 'Domestic', date: 'Mar 25', points: 100, icon: 'shield-outline', iconColor: '#388E3C', status: 'Approved', statusColor: '#4CAF50' },
  { id: '5', title: 'Volunteer Tech Support', category: 'Special', date: 'Mar 20', points: 150, icon: 'laptop', iconColor: '#6200EE', status: 'Approved', statusColor: '#4CAF50' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Open Edit Profile modal/screen");
  };

  const handleSettings = () => {
    Alert.alert(
      "Settings",
      "Manage your account",
      [
        { 
          text: "Switch to Admin", 
          onPress: () => Alert.alert('Switch to Admin', 'Navigating to Admin Portal... (To be implemented)') 
        },
        { 
          text: "Logout", 
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }),
          style: 'destructive'
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const renderPastTaskItem = ({ item }: { item: any }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskIconBox}>
        <MaterialCommunityIcons name={item.icon || 'check-circle-outline'} size={24} color={item.iconColor} />
      </View>
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskMeta}>
          {item.category}  •  {item.date}
        </Text>
      </View>
      <View style={styles.taskResultBox}>
        <Text style={styles.pointsPlus}>+{item.points}</Text>
        <Text style={[styles.statusLabel, { color: item.statusColor }]}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']}>
          {/* Top Navbar */}
          <View style={styles.topNavRow}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity onPress={handleSettings} style={styles.settingsIcon}>
              <MaterialCommunityIcons name="cog-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Profile Identity Section */}
          <View style={styles.identitySection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {USER_PROFILE.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              {/* Optional level badge */}
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>Lvl {USER_PROFILE.level}</Text>
              </View>
            </View>
            <Text style={styles.userName}>{USER_PROFILE.name}</Text>
            <Text style={styles.userEmail}>{USER_PROFILE.email}</Text>

            <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Lifetime Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{USER_PROFILE.totalTasks}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{USER_PROFILE.totalPoints}</Text>
              <Text style={styles.statLabel}>Lifetime Points</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Task History Section */}
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Past Tasks</Text>
          <MaterialCommunityIcons name="history" size={22} color="#212121" />
        </View>
        <FlatList
          data={PAST_TASKS}
          keyExtractor={(item) => item.id}
          renderItem={renderPastTaskItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerBackground: {
    backgroundColor: '#5E35B1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsIcon: {
    padding: 4,
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFB300',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#9575CD',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: '#FF5252',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5E35B1',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#D1C4E9',
    marginBottom: 15,
  },
  editProfileButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  editProfileText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 15,
    paddingVertical: 12,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#D1C4E9',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  listContent: {
    paddingBottom: 100, // accommodate bottom tab bar
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  taskIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: 12,
    color: '#757575',
  },
  taskResultBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  pointsPlus: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
