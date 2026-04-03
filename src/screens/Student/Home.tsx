import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- INITIAL MOCK DATA ---
const STATS = {
  rank: 4,
  points: 1250,
  streak: 5,
};

const DAILY_QUESTS = [
  { id: '1', title: 'Clean Dorm Room', type: 'Domestic', time: '2h left', points: 50, completed: false, icon: 'clock-outline', color: '#6200EE' },
  { id: '2', title: 'Math Assignment #4', type: 'Academic', time: 'Tomorrow', points: 100, completed: false, icon: 'clock-outline', color: '#6200EE' },
  { id: '3', title: 'Library Duty', type: 'Domestic', time: 'Completed', points: 75, completed: true, icon: 'check-circle-outline', color: '#4CAF50' },
];

const REDEEM_STORE = [
  { id: '1', title: 'Movie Ticket', points: 500, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80' },
  { id: '2', title: 'Mobile Recharge', points: 300, image: 'https://images.unsplash.com/photo-1544866092-1935c5ef2a8f?w=500&q=80' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* TOP PURPLE HEADER SECTION */}
        <View style={styles.headerBackground}>
          <SafeAreaView edges={['top']}>
            
            {/* Profile Info */}
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                {/* Yellowish background for avatar */}
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} 
                  style={styles.avatar} 
                />
              </View>
              <View style={styles.profileTextContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.nameText}>Aryan Sharma</Text>
              </View>
              <View style={styles.iconButtonsRow}>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialCommunityIcons name="magnify" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {/* Rank */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="trophy-outline" size={28} color="#FFD700" />
                <Text style={styles.statLabel}>Rank</Text>
                <Text style={styles.statValue}>#{STATS.rank}</Text>
              </View>
              {/* Points */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="star-outline" size={28} color="#FFB300" />
                <Text style={styles.statLabel}>Points</Text>
                <Text style={styles.statValue}>{STATS.points}</Text>
              </View>
              {/* Streak */}
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="trending-up" size={28} color="#00E676" />
                <Text style={styles.statLabel}>Streak</Text>
                <Text style={styles.statValue}>{STATS.streak}d</Text>
              </View>
            </View>

            <Text style={styles.sectionTitleDark}>Daily Quests</Text>
          </SafeAreaView>
        </View>

        {/* DAILY QUESTS LIST */}
        <View style={styles.questsContainer}>
          {DAILY_QUESTS.map((quest) => (
            <View key={quest.id} style={styles.questCard}>
              <View style={[styles.questIconBox, { backgroundColor: quest.completed ? '#E8F5E9' : '#F3E5F5' }]}>
                <MaterialCommunityIcons name={quest.icon as any} size={28} color={quest.color} />
              </View>
              <View style={styles.questInfo}>
                <Text style={styles.questTitle}>{quest.title}</Text>
                <View style={styles.questTagsRow}>
                  <View style={styles.questTag}>
                    <Text style={styles.questTagText}>{quest.type}</Text>
                  </View>
                  <Text style={styles.questTimeText}>• {quest.time}</Text>
                </View>
              </View>
              <View style={styles.questPointsBox}>
                <Text style={styles.pointsPlus}>+{quest.points}</Text>
                <Text style={styles.pointsLabel}>POINTS</Text>
              </View>
            </View>
          ))}
        </View>

        {/* REWARD OF THE MONTH */}
        <View style={styles.rewardContainer}>
          <View style={styles.rewardCard}>
            <View style={styles.rewardHeader}>
              <MaterialCommunityIcons name="gift-outline" size={20} color="#FFFFFF" />
              <Text style={styles.rewardTitleText}>REWARD OF THE MONTH</Text>
            </View>
            <Text style={styles.rewardMainTitle}>Premium Lounge Access</Text>
            <Text style={styles.rewardSubtext}>
              Top 3 performers get exclusive access to the student lounge for a week!
            </Text>
            <TouchableOpacity style={styles.rewardButton} onPress={() => Alert.alert('Leaderboard')}>
              <Text style={styles.rewardButtonText}>Check Leaderboard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* REDEEM POINTS */}
        <View style={styles.redeemSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Redeem Points</Text>
            <TouchableOpacity>
              <Text style={styles.storeLinkText}>Store</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.redeemScroll}>
            {REDEEM_STORE.map((item) => (
              <View key={item.id} style={styles.redeemCard}>
                <Image source={{ uri: item.image }} style={styles.redeemImage} />
                <View style={styles.redeemInfo}>
                  <Text style={styles.redeemItemTitle}>{item.title}</Text>
                  <View style={styles.redeemPointsRow}>
                    <Text style={styles.redeemCost}>{item.points} pts</Text>
                    <TouchableOpacity style={styles.addRedeemButton}>
                      <MaterialCommunityIcons name="plus" size={20} color="#6200EE" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Spacer for bottom tab bar */}
        <View style={{ height: 100 }} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBackground: {
    backgroundColor: '#5E35B1', 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFB300',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9575CD',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 14,
    color: '#D1C4E9',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  iconButtonsRow: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '31%',
  },
  statLabel: {
    color: '#D1C4E9',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitleDark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121', // The mockup shows dark text over the purple? Or wait, let me check. If the purple extends down, dark text looks weird.
    // Actually the mockup has "Daily Quests" in dark gray, but it might be on the white background.
    // Let's adjust - I'll put it outside the purple header if it's meant to be below it. But I wrote it inside.
    marginTop: 10,
  },
  questsContainer: {
    paddingHorizontal: 20,
    marginTop: -15, // Bring it up over the purple curve slightly or just below it.
  },
  questCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  questIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 6,
  },
  questTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  questTagText: {
    fontSize: 12,
    color: '#757575',
  },
  questTimeText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 8,
  },
  questPointsBox: {
    alignItems: 'flex-end',
  },
  pointsPlus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 2,
  },
  rewardContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 25,
  },
  rewardCard: {
    backgroundColor: '#FF6B6B', // Fallback for gradient
    borderRadius: 20,
    padding: 20,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rewardTitleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  rewardMainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  rewardSubtext: {
    fontSize: 14,
    color: '#FFE2E2',
    lineHeight: 20,
    marginBottom: 20,
  },
  rewardButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  rewardButtonText: {
    color: '#E64A19',
    fontWeight: 'bold',
    fontSize: 14,
  },
  redeemSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  storeLinkText: {
    fontSize: 14,
    color: '#6200EE',
    fontWeight: '600',
  },
  redeemScroll: {
    paddingHorizontal: 15,
  },
  redeemCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginHorizontal: 5,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  redeemImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  redeemInfo: {
    paddingHorizontal: 5,
  },
  redeemItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  redeemPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redeemCost: {
    fontSize: 14,
    color: '#757575',
  },
  addRedeemButton: {
    padding: 2,
  },
});
