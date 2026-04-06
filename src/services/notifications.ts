import { collection, addDoc, doc, Timestamp, WriteBatch } from 'firebase/firestore';
import { db } from './firebase';

export const createNotification = async (userId: string, message: string, type: 'approve' | 'reject' | 'system', batchRef?: WriteBatch) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const newDoc = doc(notificationsRef);
    const data = {
      toUserId:userId,
      message,
      type,
      isRead: false,
      createdAt: Timestamp.now()
    };
    
    if (batchRef) {
      batchRef.set(newDoc, data);
    } else {
      await addDoc(notificationsRef, data);
    }
  } catch (error) {
    console.error("Error creating notification: ", error);
  }
};

