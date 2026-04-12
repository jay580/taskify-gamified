// ── User ──
export interface UserProfile {
  uid: string;
  name: string;
  studentId?: string;        // e.g., "STU001"
  teamId: string;
  teamName: string;
  dateOfBirth: string;       // "YYYY-MM-DD"
  email: string;
  profileImage: string | null;
  role: 'student' | 'admin';
  pointsThisMonth: number;
  totalTasksDone: number;
  streakDays: number;
  badges: string[];
  isActive: boolean;
  isSuspended?: boolean;
  suspensionEnd?: string | null;  // ISO timestamp or null
}

// ── Team ──
export interface Team {
  id: string;
  name: string;
  totalPoints: number;
  members: string[];          // Array of user UIDs
}

// ── Task ──
export type TaskCategory = 'Academic' | 'Domestic' | 'Sports' | 'Special';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  points: number;              // Must be 5, 10, 15, or 20
  deadline: string | null;     // ISO string or null
  startTime: string | null;    // Legacy field
  endTime: string | null;      // Legacy field
  duration?: number | null;
  durationType?: 'minutes' | 'hours' | 'days' | null;
  assignedTo: string;          // "all" or specific UID
  isTeamTask: boolean;
  isRepeatable: boolean;
  isActive: boolean;
  createdAt: string;
}

// ── Submission ──
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type SubmissionType = 'task' | 'self';

export interface Submission {
  id: string;
  taskId?: string;             // optional for self-created tasks
  studentId: string;
  type: SubmissionType;        // "task" or "self"
  title: string;
  description: string;
  photoUrl: string;
  photoUrls?: string[];
  notes: string;
  status: SubmissionStatus;
  rejectionReason: string;
  pointsAwarded: number;
  submittedAt: string;
  reviewedAt: string | null;
}

// ── Monthly Results ──
export interface MonthlyResult {
  id: string;
  monthKey: string;            // e.g., "2026-04"
  studentId: string;
  points: number;
  rank: number;
  tasksDone: number;
  rewardGiven: boolean;
  rewardNote: string;
}

// ── Settings ──
export interface AppSettings {
  currentMonth: string;
  announcement: string;
  announcementExpiry: string | null;
  reward1st: string;
  reward2nd: string;
  reward3rd: string;
  lastResetAt: string;
}

// ── Notification ──
export type NotificationType = 'approved' | 'rejected' | 'announcement' | 'reward';

export interface Notification {
  id: string;
  toUserId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ── Leaderboard entry (computed) ──
export interface LeaderboardEntry {
  uid: string;
  name: string;
  initials: string;
  teamName: string;
  totalTasksDone: number;
  points: number;              // pointsThisMonth
  rank: number;
}
