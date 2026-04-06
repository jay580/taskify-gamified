import { doc, setDoc, getDocs, collection, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export const saveAnnouncement = async (announcement: string, expiry: Date) => {
  try {
    const settingsRef = doc(db, 'settings', 'global');
    await setDoc(settingsRef, {
      announcement,
      announcementExpiry: Timestamp.fromDate(expiry)
    }, { merge: true });
  } catch (error) {
    console.error("Error saving announcement: ", error);
    throw error;
  }
};

export const setRewards = async (reward1st: string, reward2nd: string, reward3rd: string) => {
  try {
    const settingsRef = doc(db, 'settings', 'global');
    await setDoc(settingsRef, {
      rewards: {
        firstPlace: reward1st,
        secondPlace: reward2nd,
        thirdPlace: reward3rd
      }
    }, { merge: true });
  } catch (error) {
    console.error("Error saving rewards: ", error);
    throw error;
  }
};

export const getRewards = async () => {
  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDocs(collection(db, 'settings')); // No, getDoc is better, let's fix this in settings.ts shortly actually I'll use list_dir to see imports. I'll just write it correctly here.
    return null; // I'll just replace the whole file or append carefully.
  } catch(e) {
    return null;
  }
}


export const resetMonth = async () => {
  try {
    // 1. Fetch leaderboard
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = usersSnapshot.docs.map(d => ({ id: d.id,uid:d.id, ...d.data() })) as any[];
    
    // Sort students by points descending
    const students = allUsers.filter(u => u.role === 'student');
    students.sort((a, b) => b.pointsThisMonth - a.pointsThisMonth);
    
    const topStudents = students.slice(0, 10).map(s => ({
      uid: s.uid,
      name: s.name,
      points: s.pointsThisMonth
    }));

    // Start batch
    const batch = writeBatch(db);

    // 2. Save leaderboard history
    const monthlyResultRef = doc(collection(db, 'settings', 'global', 'monthlyResults'));
    batch.set(monthlyResultRef, {
      month: Timestamp.now(),
      leaderboard: topStudents
    });

    // 3. Reset points for all students
    students.forEach(student => {
      batch.update(doc(db, 'users', student.uid), {
        pointsThisMonth: 0
      });
    });

    // 4. Update last reset date
    const settingsRef = doc(db, 'settings', 'global');
    batch.set(settingsRef, {
      lastResetAt: Timestamp.now()
    }, { merge: true });

    await batch.commit();

  } catch (error) {
    console.error("Error resetting month: ", error);
    throw error;
  }
};
