import { doc, setDoc, query, collection, where, orderBy, onSnapshot, updateDoc, increment, deleteField, getDoc } from 'firebase/firestore';
import { db, secondaryAuth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
}

export const createStudent = async (name: string, teamName: string, dateOfBirth: string) => {
  try {
    const studentId = `STU${Math.floor(1000 + Math.random() * 9000)}`;
    const email = `${studentId.toLowerCase()}@tq.app`;
    const password = `${studentId.toUpperCase()}@123`;

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
 * Soft-delete a student: sets isActive to false and removes from team.
 * Does NOT delete Firebase Auth user.
 */
export const deleteStudent = async (userId: string, teamId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: false,
    });

    // Remove from team members
    if (teamId) {
      await removeMemberFromTeam(teamId, userId);
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
