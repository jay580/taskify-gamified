import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ImageModal from '../../components/ImageModal';
import FadeInView from '../../components/FadeInView';
import Logo from '../../components/Logo';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../contexts/ToastContext';
import { observeTasks, Task } from '../../services/tasks';
import { observeStudents, observeLeaderboard, UserSchema } from '../../services/users';
import { observePendingSubmissions, approveSubmission, rejectSubmission, Submission } from '../../services/submissions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<UserSchema[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserSchema[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState('');
  
  const [selectedImage, setSelectedImage] = useState('');
  
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [customPoints, setCustomPoints] = useState(10);

  useEffect(() => {
    let tasksReady = false;
    let studentsReady = false;
    let subsReady = false;
    let leadReady = false;

    const checkLoading = () => {
      if (tasksReady && studentsReady && subsReady && leadReady) {
        setIsLoading(false);
      }
    };

    const unsubTasks = observeTasks((t) => { setActiveTasks(t); tasksReady = true; checkLoading(); }, true);
    const unsubStudents = observeStudents((s) => { setStudents(s); studentsReady = true; checkLoading(); });
    const unsubSubs = observePendingSubmissions((s) => { setPendingSubmissions(s); subsReady = true; checkLoading(); });
    const unsubLead = observeLeaderboard((l) => { setLeaderboard(l); leadReady = true; checkLoading(); });

    const fetchAnnouncement = async () => {
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setLatestAnnouncement(snap.docs[0].data().message);
        } else {
          setLatestAnnouncement('Keep up the great work!');
        }
      } catch (e) {
        setLatestAnnouncement('Keep up the great work!');
      }
    };
    fetchAnnouncement();

    return () => {
      unsubTasks();
      unsubStudents();
      unsubSubs();
      unsubLead();
    };
  }, []);

  const handleOpenVerification = (sub: Submission) => {
    setSelectedSubmission(sub);
    setRejectReason('');
    setIsRejecting(false);
    setImageError(false);
    setCustomPoints(sub.type === 'self' ? 10 : (sub.pointsAwarded || 10));
    setVerificationModalVisible(true);
  };

  const handleCloseVerification = () => {
    setVerificationModalVisible(false);
    setSelectedSubmission(null);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setIsActionLoading(true);
    try {
      const points = selectedSubmission.type === 'self' ? customPoints : (selectedSubmission.pointsAwarded || 10);
      await approveSubmission(selectedSubmission, points);
      showToast(`🔥 +${points} points awarded`, 'success');
      handleCloseVerification();
    } catch (error: any) {
      showToast(`⚠️ ${error.message}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    if (!rejectReason.trim()) return showToast("⚠️ Provide a reason", "error");
    setIsActionLoading(true);
    try {
      await rejectSubmission(selectedSubmission, rejectReason);
      showToast("⚠️ Submission rejected", 'error');
      handleCloseVerification();
    } catch (error: any) {
      showToast(`⚠️ ${error.message}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ marginTop: 12, color: COLORS.mutedText, fontWeight: '700' }}>Loading Dashboard...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.topGlow} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SafeAreaView edges={['top']}>
          {/* Brand Header */}
          <View style={styles.brandRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Logo size={36} />
              <Text style={styles.brandTitle}>TASK BUZZ</Text>
            </View>
            <View style={styles.adminBadge}>
              <MaterialCommunityIcons name="shield-account" size={14} color={COLORS.accent} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          </View>

          {/* Hero Card */}
          <FadeInView delay={0}>
            <View style={styles.heroCard}>
              <LinearGradient
                colors={['rgba(236, 201, 75, 0.12)', 'rgba(159, 122, 234, 0.08)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.heroGreeting}>Welcome back, Admin 👋</Text>
              <View style={styles.heroStatsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroHighlightText}>{students.length} Students</Text>
                  <View style={styles.announcementContainer}>
                    <MaterialCommunityIcons name="bullhorn" size={14} color={COLORS.accent} />
                    <Text style={styles.heroSubText} numberOfLines={1}>{latestAnnouncement}</Text>
                  </View>
                </View>
                <View style={styles.heroIconCircle}>
                  <MaterialCommunityIcons name="lightning-bolt" size={36} color={COLORS.accent} />
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Stats Row */}
          <FadeInView delay={80}>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="account-group" size={26} color={COLORS.success} />
                <Text style={styles.statValue}>{students.length}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="check-decagram" size={26} color={COLORS.accent} />
                <Text style={styles.statValue}>{activeTasks.length}</Text>
                <Text style={styles.statLabel}>Tasks</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="inbox-arrow-down" size={26} color={COLORS.link} />
                <Text style={styles.statValue}>{pendingSubmissions.length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </FadeInView>

          {/* Quick Actions */}
          <FadeInView delay={150}>
            <View style={styles.quickActions}>
              <TouchableOpacity activeOpacity={0.7} style={styles.actionBtn} onPress={() => navigation.navigate('Manage', { screen: 'Tasks' })}>
                <View style={[styles.actionIconBg, { backgroundColor: 'rgba(72, 187, 120, 0.15)' }]}>
                  <MaterialCommunityIcons name="plus-thick" size={18} color={COLORS.success} />
                </View>
                <Text style={styles.actionText}>Add Task</Text>
              </TouchableOpacity>
              
              <TouchableOpacity activeOpacity={0.7} style={styles.actionBtn} onPress={() => navigation.navigate('Manage', { screen: 'Students' })}>
                <View style={[styles.actionIconBg, { backgroundColor: 'rgba(159, 122, 234, 0.15)' }]}>
                  <MaterialCommunityIcons name="account-plus" size={18} color={COLORS.link} />
                </View>
                <Text style={styles.actionText}>Add Student</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        </SafeAreaView>

        {/* Verification Queue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Queue</Text>
          {pendingSubmissions.length === 0 ? (
            <FadeInView delay={100}>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="check-all" size={48} color={COLORS.success} />
                <Text style={styles.emptyText}>No pending submissions</Text>
              </View>
            </FadeInView>
          ) : (
            pendingSubmissions.map((sub, index) => (
              <FadeInView key={sub.id || index.toString()} delay={index * 100}>
                <Card 
                  style={[styles.submissionCard]} 
                  onPress={() => {
                    handleOpenVerification(sub);
                  }}
                  activeOpacity={0.9}
                >
                  <View style={[styles.subHeader]}>
                    <View style={styles.subStudentInfo}>
                      <View style={styles.avatarPlaceholder}>
                        <MaterialCommunityIcons name="account" size={20} color={COLORS.white} />
                      </View>
                      <View>
                        <Text style={styles.subStudentName}>{sub.studentId}</Text>
                        <Text style={styles.subTaskTitle}>{sub.title}</Text>
                      </View>
                    </View>
                    <Badge label={sub.type === 'self' ? 'Self Task' : 'Pending'} backgroundColor={sub.type === 'self' ? COLORS.link : COLORS.warning} textColor={COLORS.white} />
                  </View>
                  <View style={{ padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                     <Text style={{color: COLORS.textSecondary, fontWeight: '600'}}>Tap to verify submission</Text>
                     <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.muted} />
                  </View>
                </Card>
              </FadeInView>
            ))
          )}
        </View>
        
        {/* Leaderboard Preview */}
        {leaderboard.length > 0 && (
           <View style={[styles.section, { paddingBottom: 100 }]}>
             <Text style={styles.sectionTitle}>Top Students</Text>
             <View style={styles.leaderboardCard}>
               {leaderboard.slice(0, 3).map((student, index) => (
                 <FadeInView key={student.uid || index.toString()} delay={index * 150}>
                   <View style={[styles.leaderboardRow, index !== Math.min(2, leaderboard.length -1) && {borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder}]}>
                     <Text style={styles.rankIcon}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</Text>
                     <View style={styles.leadInfo}>
                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Text style={styles.leadName}>{student.name}</Text>
                         {student.rewardClaimed && (
                           <MaterialCommunityIcons name="bee" size={22} color="#F7D060" style={{ marginLeft: 6 }} />
                         )}
                       </View>
                       <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                         <Text style={styles.leadRoom}>{student.teamName ? `Team ${student.teamName}` : ''}</Text>
                         {student.streakDays > 1 && (
                            <View style={styles.streakBadge}>
                               <MaterialCommunityIcons name="fire" size={12} color={COLORS.accent} />
                               <Text style={{color: COLORS.accent, fontSize: 10, fontWeight: '700', marginLeft: 2}}>{student.streakDays}</Text>
                            </View>
                         )}
                       </View>
                     </View>
                     <Text style={styles.leadPoints}>{student.pointsThisMonth} pts</Text>
                   </View>
                 </FadeInView>
               ))}
             </View>
           </View>
        )}

      </ScrollView>

      {/* Verification Modal */}
      <Modal visible={verificationModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCloseVerification}>
        {selectedSubmission && (() => {
           const studentInfo = students.find(s => s.uid === selectedSubmission.studentId || s.studentId === selectedSubmission.studentId);
           const submissionImages = Array.isArray(selectedSubmission.photoUrls)
             ? selectedSubmission.photoUrls.filter(Boolean)
             : selectedSubmission.photoUrl
               ? [selectedSubmission.photoUrl]
               : [];
           return (
             <LinearGradient colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]} style={styles.verifyModalContainer}>
               {/* Modal Header */}
               <View style={styles.verifyHeader}>
                 <View style={{flex: 1}}>
                   <Badge label={selectedSubmission.type === 'self' ? 'Self Task Review' : 'Pending Review'} backgroundColor={selectedSubmission.type === 'self' ? COLORS.link : COLORS.warning} textColor={COLORS.white} style={{alignSelf: 'flex-start', marginBottom: 8}} />
                   <Text style={styles.verifyTitle}>{selectedSubmission.title}</Text>
                 </View>
                 <TouchableOpacity onPress={handleCloseVerification} style={styles.verifyCloseBtn}>
                   <MaterialCommunityIcons name="close" size={24} color={COLORS.textDark} />
                 </TouchableOpacity>
               </View>

               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.verifyScroll}>
                 
                 {/* Student Info Card */}
                 <Text style={styles.sectionTitle}>Submitted By</Text>
                 <View style={styles.verifyStudentCard}>
                   <View style={styles.avatarPlaceholder}>
                     <MaterialCommunityIcons name="account" size={24} color={COLORS.white} />
                   </View>
                   <View style={{flex: 1}}>
                     <Text style={styles.subStudentName}>{studentInfo?.name || selectedSubmission.studentId}</Text>
                     <Text style={styles.subTaskTitle}>{studentInfo?.teamName ? `Team ${studentInfo.teamName}` : 'No Team'}</Text>
                   </View>
                   <View style={{alignItems: 'flex-end'}}>
                     <Text style={{color: COLORS.mutedText, fontSize: 12, fontWeight: 'bold'}}>ID</Text>
                     <Text style={{color: COLORS.textDark, fontWeight: 'bold'}}>{studentInfo?.studentId || selectedSubmission.studentId}</Text>
                   </View>
                 </View>

                 {/* Task Details */}
                 <Text style={styles.sectionTitle}>Task Details</Text>
                 <View style={styles.detailsCard}>
                   <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="folder-outline" size={18} color={COLORS.muted} />
                      <Text style={styles.detailText}>Type: <Text style={{color: COLORS.textDark, fontWeight: 'bold'}}>{selectedSubmission.type === 'self' ? 'Self-Assigned' : 'Assigned Task'}</Text></Text>
                   </View>
                   <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.muted} />
                      <Text style={styles.detailText}>Submitted: <Text style={{color: COLORS.textDark, fontWeight: 'bold'}}>{selectedSubmission.submittedAt?.toLocaleString() || "Just now"}</Text></Text>
                   </View>
                   <Text style={styles.subDesc}>{selectedSubmission.description}</Text>
                 </View>

                 {/* Photo Section */}
                 <Text style={styles.sectionTitle}>Proof of Work</Text>
                 {submissionImages.length > 0 && !imageError ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.sm }}>
                      {submissionImages.map((uri, idx) => (
                        <TouchableOpacity key={`${uri}-${idx}`} activeOpacity={0.9} onPress={() => setSelectedImage(uri)} style={[styles.verifyImageContainer, { marginRight: SPACING.md, width: 220 }]}>
                          <Image source={{ uri }} style={styles.subImage} onError={() => setImageError(true)} />
                          <View style={styles.imageOverlay}>
                            <MaterialCommunityIcons name="magnify-plus-outline" size={24} color="#FFF" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                 ) : (
                    <View style={styles.verifyEmptyState}>
                       <MaterialCommunityIcons name="camera-off" size={32} color={COLORS.border} />
                       <Text style={{color: COLORS.muted, marginTop: 8, fontWeight: 'bold'}}>⚠️ Image not available</Text>
                    </View>
                 )}

                 {/* Notes Section */}
                 <Text style={styles.sectionTitle}>Notes</Text>
                 {selectedSubmission.notes ? (
                    <View style={styles.notesContainer}>
                      <MaterialCommunityIcons name="message-text" size={16} color={COLORS.accent} style={{marginTop: 2}} />
                      <Text style={styles.subNotes}>{selectedSubmission.notes}</Text>
                    </View>
                 ) : (
                   <View style={styles.verifyEmptyState}>
                      <MaterialCommunityIcons name="text-box-remove-outline" size={24} color={COLORS.border} />
                      <Text style={{color: COLORS.muted, marginTop: 4, fontWeight: 'bold'}}>No notes provided</Text>
                   </View>
                 )}

                 {/* Custom Points for Self Tasks */}
                 {selectedSubmission.type === 'self' && !isRejecting && (
                   <View style={{marginTop: SPACING.md}}>
                     <Text style={styles.sectionTitle}>Award Points</Text>
                     <View style={{flexDirection: 'row', gap: 10, marginBottom: SPACING.md}}>
                       {[5, 10, 15, 20].map((val) => (
                         <TouchableOpacity
                           key={val}
                           style={[styles.pointsBtn, customPoints === val && styles.pointsBtnActive]}
                           onPress={() => setCustomPoints(val)}
                         >
                           <Text style={{color: customPoints === val ? COLORS.black : COLORS.textDark, fontWeight: '800', fontSize: 16}}>{val}</Text>
                         </TouchableOpacity>
                       ))}
                     </View>
                   </View>
                 )}

                 {isRejecting && (
                   <View style={{marginTop: SPACING.md}}>
                     <Text style={[styles.sectionTitle, {color: COLORS.error}]}>Rejection Reason</Text>
                     <TextInput
                       style={styles.input}
                       placeholder="Explain why this is rejected... (Required)"
                       placeholderTextColor={COLORS.muted}
                       value={rejectReason}
                       onChangeText={setRejectReason}
                       multiline
                     />
                   </View>
                 )}

               </ScrollView>

               {/* Sticky Action Footer */}
               <View style={styles.verifyFooter}>
                 {isRejecting ? (
                   <>
                     <Button title="Cancel" variant="secondary" onPress={() => setIsRejecting(false)} style={{ flex: 1 }} disabled={isActionLoading} />
                     <Button title={isActionLoading ? "Processing..." : "Confirm Reject"} variant="danger" onPress={handleReject} style={{ flex: 1 }} disabled={isActionLoading} />
                   </>
                 ) : (
                   <>
                     <Button title="Reject" variant="danger" onPress={() => setIsRejecting(true)} style={{ flex: 1 }} disabled={isActionLoading} />
                     <Button title={isActionLoading ? "Approving..." : "Approve Task"} variant="primary" onPress={handleApprove} style={{ flex: 2 }} disabled={isActionLoading} />
                   </>
                 )}
               </View>
             </LinearGradient>
           );
        })()}
      </Modal>

      {/* Image Modal */}
      <ImageModal 
        visible={!!selectedImage} 
        imageUrl={selectedImage} 
        onClose={() => setSelectedImage('')} 
      />

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGlow: {
    position: 'absolute',
    top: -200,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: COLORS.glowPrimary,
    opacity: 0.1,
  },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl * 2, paddingTop: SPACING.sm },
  
  // Brand header
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xs,
  },
  brandTitle: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 20,
    marginLeft: 12,
    letterSpacing: 3,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassBackgroundLv2,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  adminBadgeText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },

  // Hero
  heroCard: {
    backgroundColor: COLORS.glassBackgroundLv1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  heroGreeting: { fontSize: 13, color: COLORS.mutedText, marginBottom: SPACING.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroHighlightText: { fontSize: 28, fontWeight: '900', color: COLORS.white, marginBottom: 6, letterSpacing: 0.5 },
  announcementContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroSubText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', fontStyle: 'italic' },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(236, 201, 75, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 201, 75, 0.25)',
  },

  // Stats
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xl, gap: SPACING.md },
  statCard: {
    backgroundColor: COLORS.glassBackgroundLv2,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  statValue: { fontSize: 24, fontWeight: '900', color: COLORS.white, marginTop: 8 },
  statLabel: { fontSize: 11, color: COLORS.mutedText, fontWeight: '800', textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.5 },
  
  // Quick actions
  quickActions: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.glassBackgroundLv2,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: 10,
  },
  actionIconBg: { padding: 8, borderRadius: 12 },
  actionText: { fontWeight: '800', color: COLORS.white, fontSize: 15 },
  
  // Sections
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, marginBottom: SPACING.md, letterSpacing: 0.5 },
  section: { marginBottom: SPACING.lg },
  emptyState: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassBackgroundLv3,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderStyle: 'dashed',
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '700', marginTop: SPACING.md },
  
  // Submissions
  submissionCard: { padding: 0, overflow: 'hidden' },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassBackgroundLv3,
  },
  subStudentInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glassBackgroundLv1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  subStudentName: { fontSize: 13, color: COLORS.accent, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  subTaskTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white },
  subDesc: { color: COLORS.textSecondary, fontSize: 15, padding: SPACING.lg, paddingBottom: SPACING.md, lineHeight: 22 },
  notesContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(236, 201, 75, 0.06)',
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    gap: 8,
    marginBottom: SPACING.lg,
  },
  subNotes: { color: COLORS.textSecondary, fontStyle: 'italic', flex: 1, fontWeight: '600' },
  subImage: { width: '100%', height: 200, backgroundColor: '#000' },
  imageOverlay: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 },
  
  // Leaderboard
  leaderboardCard: {
    backgroundColor: COLORS.glassBackgroundLv2,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  rankIcon: { fontSize: 24 },
  leadInfo: { flex: 1 },
  leadName: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  leadRoom: { fontSize: 13, color: COLORS.mutedText, fontWeight: '600' },
  leadPoints: { fontSize: 18, fontWeight: '800', color: COLORS.accent },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 201, 75, 0.1)',
    paddingHorizontal: 6,
    borderRadius: 8,
  },

  // Points buttons in modal
  pointsBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    alignItems: 'center' as const,
    backgroundColor: COLORS.glassBackgroundLv2,
  },
  pointsBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  // Verify modal
  input: {
    backgroundColor: COLORS.glassBackgroundLv2,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    paddingTop: SPACING.md,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
    fontSize: 16,
  },
  verifyModalContainer: { flex: 1 },
  verifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.glassBackgroundLv1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  verifyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  verifyCloseBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.glassBackgroundLv2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  verifyScroll: { padding: SPACING.lg, paddingBottom: 100 },
  verifyStudentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
    backgroundColor: 'rgba(72, 187, 120, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(72, 187, 120, 0.2)',
    borderRadius: RADIUS.lg,
  },
  detailsCard: {
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.glassBackgroundLv2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  detailText: { color: COLORS.textSecondary, fontSize: 14 },
  verifyImageContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  verifyEmptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassBackgroundLv3,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.glassBorder,
    marginBottom: SPACING.xl,
  },
  verifyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.glassBackgroundLv1,
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
});
