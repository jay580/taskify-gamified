// ── User ──
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  room: string;
  totalPoints: number;
  monthlyPoints: number;
  totalTasks: number;
  streak: number;
  level: number;
  joinDate: string;       // ISO string
  avatarColor: string;
}

// ── Task ──
export type TaskCategory = 'Academic' | 'Domestic' | 'Sports' | 'Special';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  points: number;
  deadline: string;       // ISO string
  createdBy: string;
  createdAt: string;
  status: 'active' | 'archived';
}

// ── Submission ──
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;      // denormalized for display
  taskCategory: TaskCategory;
  taskPoints: number;
  studentId: string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ── Rewards ──
export interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  imageUrl: string;
  active: boolean;
}

export interface MonthlyReward {
  title: string;
  description: string;
  month: string;
}

// ── Leaderboard entry (computed) ──
export interface LeaderboardEntry {
  uid: string;
  name: string;
  initials: string;
  room: string;
  totalTasks: number;
  points: number;           // monthlyPoints or totalPoints depending on tab
  avatarColor: string;
  rank: number;
}
