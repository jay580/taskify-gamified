import { doc, setDoc, getDocs, collection, writeBatch, Timestamp, serverTimestamp, getDoc } from 'firebase/firestore';
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
      reward1st: reward1st || '',
      reward2nd: reward2nd || '',
      reward3rd: reward3rd || '',
    }, { merge: true });
  } catch (error) {
    console.error("Error saving rewards: ", error);
    throw error;
  }
};

export const getRewards = async () => {
  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { reward1st: '', reward2nd: '', reward3rd: '' };
    }

    const data = docSnap.data();
    const rewards = data?.rewards ?? {};
    return {
      reward1st: data?.reward1st ?? rewards.firstPlace ?? '',
      reward2nd: data?.reward2nd ?? rewards.secondPlace ?? '',
      reward3rd: data?.reward3rd ?? rewards.thirdPlace ?? '',
    };
  } catch (e) {
    console.error('Error getting rewards:', e);
    return null;
  }
};


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
          rewardClaimed: false,
        });
      }
    });

    // Update settings
    const settingsRef = doc(db, 'settings', 'global');
    batch.set(settingsRef, {
      lastResetAt: serverTimestamp(),
      winnersFinalized: false,
    }, { merge: true });

    await batch.commit();

  } catch (error) {
    console.error("Error resetting month: ", error);
    throw error;
  }
};
