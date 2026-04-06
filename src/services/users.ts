import { doc, setDoc, query, collection, where, orderBy, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db, secondaryAuth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export interface UserSchema {
  id: string;
  uid: string;
  name: string;
  studentId: string;
  room: string;
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

export const createStudent = async (name: string, room: string) => {
  try {
    // Basic auto-generated sequential ID 
    // Usually you query the last student, but for simplicity here we use a random string or time
    const studentId = `STU${Math.floor(1000 + Math.random() * 9000)}`;
    const email = `${studentId.toLowerCase()}@tq.app`;
    const password = "pass" + Math.floor(1000 + Math.random() * 9000); // 4-digit PIN default

    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCred.user.uid;

    const newStudent: UserSchema = {
      id: uid,
      uid,
      name,
      studentId,
      room,
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
    return { studentId, password }; // return credentials so admin can give them to the student
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
    snapshot.forEach((doc) => students.push(doc.data() as UserSchema));
    callback(students);
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
    snapshot.forEach((doc) => students.push(doc.data() as UserSchema));
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

import { deleteField } from 'firebase/firestore';

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
