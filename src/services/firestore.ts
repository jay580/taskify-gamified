import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  UserProfile,
  Task,
  Submission,
  RewardItem,
  MonthlyReward,
  LeaderboardEntry,
} from '../types';

// ─── Helpers ───
const tsToISO = (ts: any): string => {
  if (!ts) return '';
  if (ts.toDate) return ts.toDate().toISOString();
  return String(ts);
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

// ─── User Profile ───
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid: snap.id,
    name: d.name ?? '',
    email: d.email ?? '',
    role: d.role ?? 'student',
    room: d.room ?? '',
    totalPoints: d.totalPoints ?? 0,
    monthlyPoints: d.monthlyPoints ?? 0,
    totalTasks: d.totalTasks ?? 0,
    streak: d.streak ?? 0,
    level: d.level ?? 1,
    joinDate: tsToISO(d.joinDate),
    avatarColor: d.avatarColor ?? '#FFB300',
  };
};

// ─── Tasks ───
export const getAvailableTasks = async (): Promise<Task[]> => {
  const q = query(
    collection(db, 'tasks'),
    where('status', '==', 'active'),
    orderBy('deadline', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? '',
      description: data.description ?? '',
      category: data.category ?? 'Academic',
      points: data.points ?? 0,
      deadline: tsToISO(data.deadline),
      createdBy: data.createdBy ?? '',
      createdAt: tsToISO(data.createdAt),
      status: data.status ?? 'active',
    };
  });
};

// ─── Submissions ───
export const getStudentSubmissions = async (
  uid: string,
  status?: 'pending' | 'rejected',
): Promise<Submission[]> => {
  let q;
  if (status) {
    q = query(
      collection(db, 'submissions'),
      where('studentId', '==', uid),
      where('status', '==', status),
      orderBy('submittedAt', 'desc'),
    );
  } else {
    q = query(
      collection(db, 'submissions'),
      where('studentId', '==', uid),
      orderBy('submittedAt', 'desc'),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      taskId: data.taskId ?? '',
      taskTitle: data.taskTitle ?? '',
      taskCategory: data.taskCategory ?? 'Academic',
      taskPoints: data.taskPoints ?? 0,
      studentId: data.studentId ?? '',
      submittedAt: tsToISO(data.submittedAt),
      status: data.status ?? 'pending',
      reviewedBy: data.reviewedBy,
      reviewedAt: tsToISO(data.reviewedAt),
    };
  });
};

export const getCompletedSubmissions = async (uid: string): Promise<Submission[]> => {
  const q = query(
    collection(db, 'submissions'),
    where('studentId', '==', uid),
    where('status', '==', 'approved'),
    orderBy('submittedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      taskId: data.taskId ?? '',
      taskTitle: data.taskTitle ?? '',
      taskCategory: data.taskCategory ?? 'Academic',
      taskPoints: data.taskPoints ?? 0,
      studentId: data.studentId ?? '',
      submittedAt: tsToISO(data.submittedAt),
      status: 'approved' as const,
      reviewedBy: data.reviewedBy,
      reviewedAt: tsToISO(data.reviewedAt),
    };
  });
};

export const submitTask = async (
  taskId: string,
  uid: string,
  taskTitle: string,
  taskCategory: string,
  taskPoints: number,
) => {
  return addDoc(collection(db, 'submissions'), {
    taskId,
    studentId: uid,
    taskTitle,
    taskCategory,
    taskPoints,
    submittedAt: Timestamp.now(),
    status: 'pending',
  });
};

// ─── Leaderboard ───
export const getLeaderboard = async (
  mode: 'monthly' | 'alltime',
): Promise<LeaderboardEntry[]> => {
  const field = mode === 'monthly' ? 'monthlyPoints' : 'totalPoints';
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    orderBy(field, 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, idx) => {
    const data = d.data();
    return {
      uid: d.id,
      name: data.name ?? '',
      initials: getInitials(data.name ?? ''),
      room: data.room ?? '',
      totalTasks: data.totalTasks ?? 0,
      points: data[field] ?? 0,
      avatarColor: data.avatarColor ?? '#FFB300',
      rank: idx + 1,
    };
  });
};

// ─── Rewards ───
export const getRedeemItems = async (): Promise<RewardItem[]> => {
  const q = query(collection(db, 'rewards'), where('active', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? '',
      description: data.description ?? '',
      pointsCost: data.pointsCost ?? 0,
      imageUrl: data.imageUrl ?? '',
      active: data.active ?? true,
    };
  });
};

export const getMonthlyReward = async (): Promise<MonthlyReward | null> => {
  const snap = await getDoc(doc(db, 'settings', 'monthlyReward'));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    title: d.title ?? '',
    description: d.description ?? '',
    month: d.month ?? '',
  };
};
