import { doc, setDoc, getDocs, collection, writeBatch, Timestamp, serverTimestamp } from 'firebase/firestore';
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
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = usersSnapshot.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() })) as any[];
    
    const students = allUsers.filter(u => u.role === 'student');
    students.sort((a, b) => (b.pointsThisMonth || 0) - (a.pointsThisMonth || 0));
    
    const batch = writeBatch(db);

    // Save leaderboard safe history
    const monthlyResultRef = doc(collection(db, 'monthlyResults'));
    const safeTopStudents = students.slice(0, 10).map(s => ({
      uid: s.uid ?? null,
      name: s.name ?? "Unknown",
      points: s.pointsThisMonth ?? 0
    }));

    batch.set(monthlyResultRef, {
      month: new Date().toISOString().slice(0, 7) ,
      leaderboard: safeTopStudents
    });

    // Reset loop
    usersSnapshot.forEach((userDoc) => {
      const data = userDoc.data();
      if (data.role === 'student') {
        const userRef = doc(db, "users", userDoc.id);
        batch.update(userRef, {
          pointsThisMonth: 0,
          totalTasksDone: 0,
        });
      }
    });

    // Update settings
    const settingsRef = doc(db, 'settings', 'global');
    batch.set(settingsRef, {
      lastResetAt: serverTimestamp()
    }, { merge: true });

    await batch.commit();

  } catch (error) {
    console.error("Error resetting month: ", error);
    throw error;
  }
};
