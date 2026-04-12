import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ImageModal from '../../components/ImageModal';
import FadeInView from '../../components/FadeInView';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../contexts/ToastContext';
import { observeTasks, Task } from '../../services/tasks';
import { observeStudents, observeLeaderboard, UserSchema } from '../../services/users';
import { observePendingSubmissions, approveSubmission, rejectSubmission, Submission } from '../../services/submissions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ marginTop: 10, color: COLORS.mutedText, fontWeight: '700' }}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScreenWrapper>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* HERO SECTION */}
          <FadeInView delay={0}>
            <Card variant="hero" style={styles.heroCard}>
              <View style={styles.heroOverlay} />
              <Text style={styles.heroGreeting}>Welcome back, Admin 👋</Text>
              <View style={styles.heroStatsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroHighlightText}> {students.length} Total Students</Text>
                  <View style={styles.announcementContainer}>
                     <MaterialCommunityIcons name="bullhorn" size={14} color={COLORS.accent} />
                     <Text style={styles.heroSubText} numberOfLines={1}>{latestAnnouncement}</Text>
                  </View>
                </View>
                <View style={styles.heroIconCircle}>
                  <MaterialCommunityIcons name="lightning-bolt" size={36} color={COLORS.accent} />
                </View>
              </View>
            </Card>
          </FadeInView>

          {/* DASHBOARD STATS */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="account-group" size={28} color={COLORS.success} />
              <Text style={styles.statValue}>{students.length}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="check-decagram" size={28} color={COLORS.accent} />
              <Text style={styles.statValue}>{activeTasks.length}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="inbox-arrow-down" size={28} color={COLORS.secondary} />
              <Text style={styles.statValue}>{pendingSubmissions.length}</Text>
              <Text style={styles.statLabel}>Subs</Text>
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.quickActions}>
            <TouchableOpacity activeOpacity={0.7} style={styles.actionBtn} onPress={() => navigation.navigate('Manage', { screen: 'Tasks' })}>
              <View style={[styles.actionIconBg, { backgroundColor: COLORS.successLight }]}>
                <MaterialCommunityIcons name="plus-thick" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.actionText}>Add Task</Text>
            </TouchableOpacity>
            
            <TouchableOpacity activeOpacity={0.7} style={styles.actionBtn} onPress={() => navigation.navigate('Manage', { screen: 'Students' })}>
              <View style={[styles.actionIconBg, { backgroundColor: '#E2E8F0' }]}>
                <MaterialCommunityIcons name="account-plus" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Add Student</Text>
            </TouchableOpacity>
          </View>

          {/* VERIFICATION QUEUE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification Queue</Text>
            {pendingSubmissions.length === 0 ? (
              <FadeInView delay={100}>
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="check-all" size={56} color={COLORS.success} />
                  <Text style={styles.emptyText}>No pending submissions </Text>
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
          
          {/* LEADERBOARD PREVIEW */}
          {leaderboard.length > 0 && (
             <View style={[styles.section, { paddingBottom: 60 }]}>
               <Text style={styles.sectionTitle}>Top Students</Text>
               <Card style={{padding: 0, overflow: 'hidden'}}>
                 {leaderboard.slice(0, 3).map((student, index) => (
                   <FadeInView key={student.uid || index.toString()} delay={index * 150}>
                     <View style={[styles.leaderboardRow, index !== Math.min(2, leaderboard.length -1) && {borderBottomWidth: 1, borderBottomColor: COLORS.border}]}>
                       <Text style={styles.rankIcon}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</Text>
                       <View style={styles.leadInfo}>
                         <Text style={styles.leadName}>{student.name}</Text>
                         <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                           <Text style={styles.leadRoom}>{student.teamName ? `Team ${student.teamName}` : ''}</Text>
                           {student.streakDays > 1 && (
                              <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(236, 201, 75, 0.1)', paddingHorizontal: 6, borderRadius: 8}}>
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
               </Card>
             </View>
          )}

        </ScrollView>
      </ScreenWrapper>

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
             <View style={styles.verifyModalContainer}>
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
                 <Card style={styles.verifyStudentCard}>
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
                 </Card>

                 {/* Task Details */}
                 <Text style={styles.sectionTitle}>Task Details</Text>
                 <Card style={styles.detailsCard}>
                   <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="folder-outline" size={18} color={COLORS.muted} />
                      <Text style={styles.detailText}>Type: <Text style={{color: COLORS.textDark, fontWeight: 'bold'}}>{selectedSubmission.type === 'self' ? 'Self-Assigned' : 'Assigned Task'}</Text></Text>
                   </View>
                   <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.muted} />
                      <Text style={styles.detailText}>Submitted: <Text style={{color: COLORS.textDark, fontWeight: 'bold'}}>{selectedSubmission.submittedAt?.toLocaleString() || "Just now"}</Text></Text>
                   </View>
                   <Text style={styles.subDesc}>{selectedSubmission.description}</Text>
                 </Card>

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
                           style={{
                             flex: 1, padding: 12, borderWidth: 1, borderColor: COLORS.border,
                             borderRadius: RADIUS.md, alignItems: 'center' as const,
                             backgroundColor: customPoints === val ? COLORS.accent : COLORS.surfaceAlt,
                           }}
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
             </View>
           );
        })()}
      </Modal>

      {/* Image Modal */}
      <ImageModal 
        visible={!!selectedImage} 
        imageUrl={selectedImage} 
        onClose={() => setSelectedImage('')} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  content: { paddingBottom: SPACING.xl * 2, paddingTop: SPACING.sm },
  
  heroCard: { marginBottom: SPACING.xl },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(236, 201, 75, 0.05)' },
  heroGreeting: { fontSize: 14, color: COLORS.mutedText, marginBottom: SPACING.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroHighlightText: { fontSize: 26, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  announcementContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroSubText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', fontStyle: 'italic' },
  heroIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(236, 201, 75, 0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(236, 201, 75, 0.3)' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xl, gap: SPACING.md },
  statCard: { backgroundColor: COLORS.backgroundSecondary, paddingVertical: SPACING.lg, borderRadius: RADIUS.md, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceAlt, shadowColor: COLORS.black, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 6 },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, marginTop: 8 },
  statLabel: { fontSize: 11, color: COLORS.mutedText, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  actionBtn: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  actionIconBg: { padding: 8, borderRadius: 12 },
  actionText: { fontWeight: '800', color: COLORS.textDark, fontSize: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, marginBottom: SPACING.md, letterSpacing: 0.5 },
  section: { marginBottom: SPACING.lg },
  emptyState: { padding: SPACING.xl * 2, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.backgroundSecondary, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '800', marginTop: SPACING.md },
  submissionCard: { padding: 0, overflow: 'hidden' },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.backgroundPrimary, backgroundColor: COLORS.surfaceAlt },
  subStudentInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border },
  subStudentName: { fontSize: 13, color: COLORS.accent, fontWeight: '800', textTransform: 'uppercase' },
  subTaskTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
  subDesc: { color: COLORS.textSecondary, fontSize: 15, padding: SPACING.lg, paddingBottom: SPACING.md, lineHeight: 22 },
  notesContainer: { flexDirection: 'row', backgroundColor: 'rgba(236, 201, 75, 0.05)', marginHorizontal: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.sm, borderLeftWidth: 3, borderLeftColor: COLORS.accent, gap: 8, marginBottom: SPACING.lg },
  subNotes: { color: COLORS.textSecondary, fontStyle: 'italic', flex: 1, fontWeight: '600' },
  subImage: { width: '100%', height: 200, backgroundColor: '#000' },
  imageOverlay: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 20 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, backgroundColor: COLORS.surface, gap: SPACING.md },
  rankIcon: { fontSize: 24 },
  leadInfo: { flex: 1 },
  leadName: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  leadRoom: { fontSize: 13, color: COLORS.mutedText, fontWeight: '600' },
  leadPoints: { fontSize: 18, fontWeight: '800', color: COLORS.accent },
  input: { backgroundColor: COLORS.backgroundPrimary, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, paddingTop: SPACING.md, minHeight: 120, textAlignVertical: 'top', marginBottom: SPACING.lg, fontSize: 16 },
  verifyModalContainer: { flex: 1, backgroundColor: COLORS.backgroundPrimary },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xl, paddingBottom: SPACING.md, backgroundColor: COLORS.surfaceAlt, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  verifyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  verifyCloseBtn: { padding: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  verifyScroll: { padding: SPACING.lg, paddingBottom: 100 },
  verifyStudentCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginBottom: SPACING.xl, gap: SPACING.md, backgroundColor: 'rgba(56, 161, 105, 0.05)', borderWidth: 1, borderColor: 'rgba(56, 161, 105, 0.2)' },
  detailsCard: { padding: SPACING.md, marginBottom: SPACING.xl, backgroundColor: COLORS.surface },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: SPACING.sm, marginBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.backgroundPrimary },
  detailText: { color: COLORS.textSecondary, fontSize: 14 },
  verifyImageContainer: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  verifyEmptyState: { padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.border, marginBottom: SPACING.xl },
  verifyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surfaceAlt, flexDirection: 'row', padding: SPACING.lg, paddingBottom: SPACING.xl, gap: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 },
});
