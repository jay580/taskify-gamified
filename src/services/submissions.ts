import { collection, query, where, doc, writeBatch, Timestamp, onSnapshot, increment } from 'firebase/firestore';
import { db, auth } from './firebase';
import { createNotification } from './notifications';

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  type: 'task' | 'self';
  title: string;
  description: string;
  photoUrl: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string;
  pointsAwarded: number;
  submittedAt: Date;
  reviewedAt?: Date;
}

export const observePendingSubmissions = (callback: (submissions: Submission[]) => void) => {
  const q = query(collection(db, 'submissions'), where("status", "==", "pending"));

  return onSnapshot(q, (snapshot) => {
    const submissions: Submission[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        taskId: data.taskId || '',
        studentId: data.studentId || '',
        type: data.type || 'task',
        title: data.title || '',
        description: data.description || '',
        photoUrl: data.photoUrl || '',
        notes: data.notes || '',
        status: data.status,
        rejectionReason: data.rejectionReason || '',
        pointsAwarded: data.pointsAwarded || 0,
        submittedAt: data.submittedAt?.toDate(),
        reviewedAt: data.reviewedAt?.toDate(),
      });
    });
    callback(submissions);
  }, error => {
    console.error("Error observing pending submissions: ", error);
  });
};

export const approveSubmission = async (submission: Submission, taskPoints: number) => {
  try {
    const adminUid = auth.currentUser?.uid;
    if (!adminUid) throw new Error("Admin not logged in");

    const batch = writeBatch(db);

    // Update submission
    const submissionRef = doc(db, 'submissions', submission.id);
    batch.update(submissionRef, {
      status: 'approved',
      pointsAwarded: taskPoints,
      reviewedAt: Timestamp.now()
    });

    // Update user points + tasks done
    console.log("submission: ", submission);
    const userRef = doc(db, 'users', submission.studentId);
    batch.update(userRef, {
      pointsThisMonth: increment(taskPoints),
      totalTasksDone: increment(1)
    });

    // Trigger Notification
    await createNotification(
      submission.studentId, 
      `Your submission for "${submission.title}" was approved! 🎉 You earned ${taskPoints} points.`, 
      'approve',
      batch
    );

    // ALL ONE ATOMIC OP
    await batch.commit();
  } catch (error) {
    console.error("Error approving submission: ", error);
    throw error;
  }
};

export const rejectSubmission = async (submission: Submission, reason: string) => {
  try {
    const adminUid = auth.currentUser?.uid;
    if (!adminUid) throw new Error("Admin not logged in");

    const batch = writeBatch(db);
    const submissionRef = doc(db, 'submissions', submission.id);

    batch.update(submissionRef, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: Timestamp.now()
    });

    // Trigger Notification
    await createNotification(
      submission.studentId, 
      `Your submission for "${submission.title}" was rejected. Reason: ${reason}`, 
      'reject',
      batch
    );

    // ALL ONE ATOMIC OP
    await batch.commit();
  } catch (error) {
    console.error("Error rejecting submission: ", error);
    throw error;
  }
};
