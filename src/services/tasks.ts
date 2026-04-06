import { collection, addDoc, getDocs, Timestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export type TaskPoints = 5 | 10 | 15 | 20;

export interface Task {
  id?: string;
  title: string;
  description: string;
  category: string;
  points: TaskPoints;
  deadline: Date;
  assignedTo: string; // e.g., 'all', or specific STU ID
  isTeamTask: boolean;
  isRepeatable: boolean;
  isActive: boolean;
  createdAt?: Date;
}

export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...task,
      createdAt: Timestamp.now(),
      deadline: Timestamp.fromDate(task.deadline),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating task: ", error);
    throw error;
  }
};

export const observeTasks = (callback: (tasks: Task[]) => void, activeOnly: boolean = false) => {
  let q = collection(db, 'tasks') as any;
  if (activeOnly) {
    q = query(q, where('isActive', '==', true));
  }

  return onSnapshot(q, (snapshot: any) => {
    const tasks: Task[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category || '',
        points: data.points as TaskPoints,
        deadline: data.deadline?.toDate(),
        assignedTo: data.assignedTo || 'all',
        isTeamTask: data.isTeamTask || false,
        isRepeatable: data.isRepeatable || false,
        isActive: data.isActive || false,
        createdAt: data.createdAt?.toDate(),
      });
    });
    callback(tasks);
  }, (error: any) => {
    console.error("Error observing tasks", error);
  });
};

export const toggleTaskActive = async (taskId: string, currentStatus: boolean) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { isActive: !currentStatus });
  } catch (error) {
    console.error("Error toggling task status: ", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    console.error("Error deleting task: ", error);
    throw error;
  }
};
