import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY_TABS = ['Available', 'Submissions', 'Completed'];
const CATEGORIES = ['All', 'Academic', 'Domestic', 'Sports', 'Special'];

const MOCK_AVAILABLE_TASKS = [
  { id: '1', title: 'Library assignment log', category: 'Academic', date: 'Apr 6', points: 50, icon: 'clock-outline', iconColor: '#1976D2', tagColor: '#E3F2FD', tagTextColor: '#1976D2' },
  { id: '2', title: 'Morning room cleanup', category: 'Domestic', date: 'Apr 5', points: 30, icon: 'clock-outline', iconColor: '#388E3C', tagColor: '#E8F5E9', tagTextColor: '#388E3C' },
  { id: '3', title: 'Morning PT session', category: 'Sports', date: 'Apr 7', points: 35, icon: 'clock-outline', iconColor: '#F57C00', tagColor: '#FFF3E0', tagTextColor: '#F57C00' },
  { id: '4', title: 'Special event volunteer', category: 'Special', date: 'Apr 12', points: 150, icon: 'star-outline', iconColor: '#6200EE', tagColor: '#F3E5F5', tagTextColor: '#6200EE' },
];

const MOCK_SUBMISSIONS = [
  { id: 's1', title: 'Weekend campus sweep', category: 'Domestic', date: 'Apr 1', points: 40, icon: 'clock-outline', iconColor: '#388E3C', status: 'Pending', statusColor: '#FFA000' },
  { id: 's2', title: 'Math tutorial', category: 'Academic', date: 'Mar 28', points: 60, icon: 'check-circle-outline', iconColor: '#1976D2', status: 'Rejected', statusColor: '#D32F2F' },
];

const MOCK_COMPLETED = [
  { id: 'c1', title: 'Hostel Night Guard', category: 'Domestic', date: 'Mar 25', points: 100, icon: 'check-circle-outline', iconColor: '#388E3C' },
];

export default function TasksScreen() {
  const [activeTab, setActiveTab] = useState('Available');
  const [activeCategory, setActiveCategory] = useState('All');

  // Filter logic
  const getDisplayData = () => {
    let data : any[] = [];
    if (activeTab === 'Available') data = MOCK_AVAILABLE_TASKS;
    if (activeTab === 'Submissions') data = MOCK_SUBMISSIONS;
    if (activeTab === 'Completed') data = MOCK_COMPLETED;

    if (activeCategory !== 'All') {
      data = data.filter(task => task.category === activeCategory);
    }
    return data;
  };

  const renderTaskCard = ({ item }: { item: any }) => (
    <View style={styles.cardContainer}>
      <View style={styles.cardIconBox}>
        <MaterialCommunityIcons name={item.icon || 'clock-outline'} size={24} color={item.iconColor} />
      </View>
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.cardTagsRow}>
          {item.category && item.tagColor && (
            <View style={[styles.categoryTag, { backgroundColor: item.tagColor }]}>
              <Text style={[styles.categoryTagText, { color: item.tagTextColor || '#333' }]}>
                {item.category}
              </Text>
            </View>
          )}
          <Text style={styles.dateText}>• {item.date}</Text>
          {item.status && (
            <Text style={[styles.statusText, { color: item.statusColor }]}>
              {' '}- {item.status}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.cardPointsBox}>
        <Text style={styles.pointsPlus}>+{item.points}</Text>
        <Text style={styles.pointsLabel}>POINTS</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']}>
          {/* Header Top Row */}
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Tasks</Text>
            <TouchableOpacity>
              <MaterialCommunityIcons name="dots-horizontal" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Primary Tabs (Segmented Control) */}
          <View style={styles.segmentedControl}>
            {PRIMARY_TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity 
                  key={tab} 
                  style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      {/* Category Filters (Overlapping the purple background slightly just by positioning if we want, but keeping it simple here) */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity 
                key={cat}
                style={[styles.filterPill, isActive ? styles.filterPillActive : styles.filterPillInactive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={isActive ? styles.filterPillTextActive : styles.filterPillTextInactive}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Task List */}
      <FlatList
        data={getDisplayData()}
        keyExtractor={item => item.id}
        renderItem={renderTaskCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found.</Text>
          </View>
        }
      />
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
    paddingBottom: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)', // Darker translucent background
    borderRadius: 25,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: '#D1C4E9',
    fontWeight: '600',
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#5E35B1',
  },
  filterSection: {
    marginTop: -20, // Negative margin to overlap the purple background
  },
  filterScroll: {
    paddingHorizontal: 15,
    paddingBottom: 15, // Space for shadow
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterPillActive: {
    backgroundColor: '#6200EE',
  },
  filterPillInactive: {
    backgroundColor: '#333333', // Dark cards as per design
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  filterPillTextInactive: {
    color: '#E0E0E0',
    fontWeight: '600',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100, // Space for bottom tabs
  },
  cardContainer: {
    backgroundColor: '#2C2C2E', // Very dark grey/black background
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#A0A0A0',
    fontSize: 12,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardPointsBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  pointsPlus: {
    color: '#64B5F6', // Light blue/purple color for active points
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsLabel: {
    color: '#A0A0A0',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#757575',
    fontSize: 16,
  }
});
