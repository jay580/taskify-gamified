import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const useUser = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUser({ id: docSnap.id, uid: auth.currentUser?.uid, ...docSnap.data() });
      }
    });

    return () => unsub();
  }, []);

  return user;
};
