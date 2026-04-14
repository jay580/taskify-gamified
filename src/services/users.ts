import { doc, setDoc, query, collection, where, orderBy, onSnapshot, updateDoc, increment, deleteField, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, secondaryAuth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { addMemberToTeam, removeMemberFromTeam, findOrCreateTeam } from './teams';

export interface UserSchema {
  id: string;
  uid: string;
  name: string;
  studentId: string;
  teamId: string;
  teamName: string;
  dateOfBirth: string;
  email: string;
  role: 'admin' | 'student';
  pointsThisMonth: number;
  totalTasksDone: number;
  streakDays: number;
  badges: string[];
  isActive: boolean;
  isSuspended: boolean;
  suspensionEnd?: Date;
  profileImage: string | null;
  needsProfileUpdate?: boolean;
}

/**
 * Generates a student ID based on name and DOB.
 * Format: [first 2 of first name][first 2 of last name][day][month][2 random digits]
 */
const generateStudentId = (name: string, dob: string) => {
  const parts = name.trim().toLowerCase().split(/\s+/);
  const firstName = parts[0] || "st";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  const firstPart = firstName.slice(0, 2);
  const lastPart = lastName.slice(0, 2);

  // dob expected format: YYYY-MM-DD
  const dateParts = dob.split(/[-/.]/);
  let day = "00";
  let month = "00";

  if (dateParts.length >= 3) {
    if (dateParts[0].length === 4) {
      // YYYY-MM-DD
      month = dateParts[1];
      day = dateParts[2];
    } else {
      // DD-MM-YYYY
      day = dateParts[0];
      month = dateParts[1];
    }
  }

  // Ensure 2 digits for day/month
  const d = (day || "00").padStart(2, '0').slice(-2);
  const m = (month || "00").padStart(2, '0').slice(-2);
  
  // Add 2 random digits to prevent collisions (e.g., same initials and same DOB)
  const rand = Math.floor(10 + Math.random() * 90);

  return `${firstPart}${lastPart}${d}${m}${rand}`.replace(/[^a-z0-9]/g, '');
};

export const createStudent = async (name: string, teamName: string, dateOfBirth: string) => {
  try {
    const studentId = generateStudentId(name, dateOfBirth);
    const email = `${studentId.toLowerCase()}@tq.app`;
    const password = `${studentId.toUpperCase()}@123`;

    // 1. Check if a user with this email/ID already exists in Firestore to avoid collisions
    const existingSnap = await getDoc(doc(db, 'users', studentId)); 
    // Usually studentId is same as UID in some systems, but here UID is from Auth.
    // However, we should check if the email is taken.
    const qEmail = query(collection(db, 'users'), where('email', '==', email));
    const emailSnap = await getDocs(qEmail);
    if (!emailSnap.empty) {
      throw new Error(`A student with ID ${studentId} or email ${email} already exists.`);
    }

    // Find or create the team
    const teamId = teamName ? await findOrCreateTeam(teamName) : '';

    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCred.user.uid;

    const newStudent: UserSchema = {
      id: uid,
      uid,
      name,
      studentId,
      teamId,
      teamName: teamName || '',
      dateOfBirth: dateOfBirth || '',
      email,
      role: 'student',
      pointsThisMonth: 0,
      totalTasksDone: 0,
      streakDays: 0,
      badges: [],
      isActive: true,
      isSuspended: false,
      profileImage: null,
      needsProfileUpdate: true,
    };

    await setDoc(doc(db, 'users', uid), newStudent);

    // Add to team members
    if (teamId) {
      await addMemberToTeam(teamId, uid);
    }

    return { studentId, email, password };
  } catch (error) {
    console.error("Error creating student: ", error);
    throw error;
  }
};

export const observeStudents = (callback: (users: UserSchema[]) => void) => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    orderBy('name', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const students: UserSchema[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      students.push({
        id: doc.id,
        uid: doc.id,
        name: data.name || '',
        studentId: data.studentId || '',
        teamId: data.teamId || '',
        teamName: data.teamName || '',
        dateOfBirth: data.dateOfBirth || '',
        email: data.email || '',
        role: 'student',
        pointsThisMonth: data.pointsThisMonth || 0,
        totalTasksDone: data.totalTasksDone || 0,
        streakDays: data.streakDays || 0,
        badges: data.badges || [],
        isActive: data.isActive !== false,
        isSuspended: data.isSuspended || false,
        suspensionEnd: data.suspensionEnd?.toDate?.() || undefined,
        profileImage: data.profileImage || null,
        needsProfileUpdate: data.needsProfileUpdate || false,
      });
    });
    // Filter out inactive students in the observer
    callback(students.filter(s => s.isActive !== false));
  }, error => {
    console.error("Error observing students: ", error);
  });
};

export const observeLeaderboard = (callback: (users: UserSchema[]) => void) => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    orderBy('pointsThisMonth', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const students: UserSchema[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isActive === false) return; // Skip inactive students
      students.push({
        id: doc.id,
        uid: doc.id,
        name: data.name || '',
        studentId: data.studentId || '',
        teamId: data.teamId || '',
        teamName: data.teamName || '',
        dateOfBirth: data.dateOfBirth || '',
        email: data.email || '',
        role: 'student',
        pointsThisMonth: data.pointsThisMonth || 0,
        totalTasksDone: data.totalTasksDone || 0,
        streakDays: data.streakDays || 0,
        badges: data.badges || [],
        isActive: data.isActive !== false,
        isSuspended: data.isSuspended || false,
        profileImage: data.profileImage || null,
        needsProfileUpdate: data.needsProfileUpdate || false,
      });
    });
    callback(students);
  }, error => {
    console.error("Error observing leaderboard: ", error);
  });
};

export const updateUserPoints = async (userId: string, points: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pointsThisMonth: increment(points),
      totalTasksDone: increment(1)
    });
  } catch (error) {
    console.error("Error updating user points: ", error);
    throw error;
  }
};

/**
 * Award bonus points to a user (admin gift).
 * Does NOT increment team points — team points only update via approveSubmission.
 */
export const awardAdminPoints = async (userId: string, points: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pointsThisMonth: increment(points),
    });
  } catch (error) {
    console.error("Error awarding points: ", error);
    throw error;
  }
};

/**
 * Hard-delete a student: removes Firestore doc, team membership, and Firebase Auth account.
 *
 * Strategy (works on Spark free plan):
 * 1. Remove from team first.
 * 2. Delete the Firestore user doc (this also triggers `onUserDeleted` Cloud Function if deployed on Blaze).
 * 3. Attempt client-side Auth deletion using the secondaryAuth instance + generated password.
 *    This succeeds for students who have NOT changed their password.
 *    If they have changed it (via ForceUpdateProfileScreen), this step is silently skipped.
 */
export const deleteStudent = async (userId: string, teamId: string, email?: string, studentId?: string) => {
  try {
    // Step 1: Remove from team to avoid dangling references
    if (teamId) {
      await removeMemberFromTeam(teamId, userId);
    }

    // Step 2: Delete the Firestore doc
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    // Step 3: Attempt to delete from Firebase Auth client-side
    // This works when the student hasn't changed their generated password.
    if (email && studentId) {
      const generatedPassword = `${studentId.toUpperCase()}@123`;
      try {
        const userCred = await signInWithEmailAndPassword(secondaryAuth, email, generatedPassword);
        await deleteUser(userCred.user);
      } catch {
        // Silently ignore — either password was changed or account already gone.
        // The Firestore deletion is the source of truth; Auth orphan is non-critical.
        console.info(`Auth user ${userId} could not be deleted client-side (likely changed password). Firestore record removed.`);
      }
    }
  } catch (error) {
    console.error("Error deleting student: ", error);
    throw error;
  }
};



export const updateStudentSuspension = async (userId: string, durationDays: number | null) => {
  if (!userId) throw new Error("Invalid user ID");
  try {
    const userRef = doc(db, 'users', userId);
    if (durationDays === null || durationDays <= 0) {
      await updateDoc(userRef, {
        isSuspended: false,
        suspensionEnd: deleteField()
      });
    } else {
      const end = new Date();
      end.setDate(end.getDate() + durationDays);
      await updateDoc(userRef, {
        isSuspended: true,
        suspensionEnd: end
      });
    }
  } catch (error) {
    console.error("Error updating suspension: ", error);
    throw error;
  }
};
