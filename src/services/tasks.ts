import { collection, addDoc, Timestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { TaskDurationType } from '../utils/taskStatus';

export type TaskPoints = 5 | 10 | 15 | 20;

export interface Task {
  id?: string;
  title: string;
  description: string;
  category: string;
  points: TaskPoints;
  deadline: Date;
  startTime?: Date | null;    // Legacy
  endTime?: Date | null;      // Legacy
  duration?: number;
  durationType?: TaskDurationType;
  assignedTo: string;
  isTeamTask: boolean;
  isRepeatable: boolean;
  isActive: boolean;
  createdAt?: Date;
}

export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
  try {
    const safeDuration =
      typeof task.duration === 'number' && Number.isFinite(task.duration) && task.duration > 0
        ? Math.floor(task.duration)
        : 0;

    const taskData: Record<string, any> = {
      title: task.title,
      description: task.description,
      category: task.category,
      points: task.points,
      deadline: Timestamp.fromDate(task.deadline),
      assignedTo: task.assignedTo,
      isTeamTask: task.isTeamTask,
      isRepeatable: task.isRepeatable,
      isActive: task.isActive,
      createdAt: serverTimestamp(),
      duration: safeDuration,
      durationType: task.durationType ?? 'hours',
    };

    if (task.startTime) {
      taskData.startTime = Timestamp.fromDate(task.startTime);
    }
    if (task.endTime) {
      taskData.endTime = Timestamp.fromDate(task.endTime);
    }

    const docRef = await addDoc(collection(db, 'tasks'), taskData);
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
        startTime: data.startTime?.toDate() || null,
        endTime: data.endTime?.toDate() || null,
        duration: typeof data.duration === 'number' ? data.duration : 0,
        durationType: data.durationType,
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
