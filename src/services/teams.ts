import { collection, doc, addDoc, onSnapshot, updateDoc, query, orderBy, increment, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export interface TeamSchema {
  id: string;
  name: string;
  totalPoints: number;
  members: string[];
}

/**
 * Create a new team in the "teams" collection.
 */
export const createTeam = async (name: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'teams'), {
      name,
      totalPoints: 0,
      members: [],
    });
    // Update the doc to store its own ID
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
};

/**
 * Observe all teams in real-time, sorted by name.
 */
export const observeTeams = (callback: (teams: TeamSchema[]) => void) => {
  const q = query(collection(db, 'teams'), orderBy('name', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const teams: TeamSchema[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      teams.push({
        id: doc.id,
        name: data.name || '',
        totalPoints: data.totalPoints || 0,
        members: data.members || [],
      });
    });
    callback(teams);
  }, (error) => {
    console.error("Error observing teams:", error);
  });
};

/**
 * Observe teams sorted by totalPoints (descending) for leaderboard.
 */
export const observeTeamLeaderboard = (callback: (teams: TeamSchema[]) => void) => {
  const q = query(collection(db, 'teams'), orderBy('totalPoints', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const teams: TeamSchema[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      teams.push({
        id: doc.id,
        name: data.name || '',
        totalPoints: data.totalPoints || 0,
        members: data.members || [],
      });
    });
    callback(teams);
  }, (error) => {
    console.error("Error observing team leaderboard:", error);
  });
};

/**
 * Add a user UID to a team's members array.
 */
export const addMemberToTeam = async (teamId: string, userId: string) => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      members: arrayUnion(userId),
    });
  } catch (error) {
    console.error("Error adding member to team:", error);
    throw error;
  }
};

/**
 * Remove a user UID from a team's members array.
 */
export const removeMemberFromTeam = async (teamId: string, userId: string) => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      members: arrayRemove(userId),
    });
  } catch (error) {
    console.error("Error removing member from team:", error);
    throw error;
  }
};

/**
 * Increment a team's totalPoints (used during submission approval).
 */
export const incrementTeamPoints = async (teamId: string, points: number) => {
  if (!teamId) return; // No team assigned
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      totalPoints: increment(points),
    });
  } catch (error) {
    console.error("Error incrementing team points:", error);
    throw error;
  }
};

/**
 * Gift points directly to a team (does NOT update individual users).
 */
export const giftPointsToTeam = async (teamId: string, points: number) => {
  if (!teamId) return;
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      totalPoints: increment(points),
    });
  } catch (error) {
    console.error("Error gifting points to team:", error);
    throw error;
  }
};

/**
 * Find or create a team by name. Returns the team ID.
 */
export const findOrCreateTeam = async (teamName: string): Promise<string> => {
  try {
    // Try to find existing team
    const q = query(collection(db, 'teams'));
    const { getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      if (docSnap.data().name?.toLowerCase() === teamName.toLowerCase()) {
        return docSnap.id;
      }
    }
    
    // Create new team
    return await createTeam(teamName);
  } catch (error) {
    console.error("Error finding/creating team:", error);
    throw error;
  }
};
