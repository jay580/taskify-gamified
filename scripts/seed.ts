/**
 * Seed script — run with: npx ts-node scripts/seed.ts
 *
 * Creates:
 *  - A test student account in Firebase Auth
 *  - Sample users, tasks, submissions, rewards, and monthly reward in Firestore
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAa2y0mBwSoD5p75zWlmrB2soegcI0qVes',
  authDomain: 'ssiapp-6e196.firebaseapp.com',
  projectId: 'ssiapp-6e196',
  storageBucket: 'ssiapp-6e196.firebasestorage.app',
  messagingSenderId: '1032701302415',
  appId: '1:1032701302415:web:b0f8be5dc12f598970c2fa',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  console.log('🌱 Seeding Firestore...\n');

  // ── 1. Create test student in Auth ──
  let studentUid = '';
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      'student@taskify.com',
      'Test1234!',
    );
    studentUid = cred.user.uid;
    console.log('✅ Created auth user: student@taskify.com, UID:', studentUid);
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('⚠️  student@taskify.com already exists — skipping auth creation');
      // You'll need to manually look up the UID or sign in
      // For now we'll use a placeholder — update if needed
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const cred = await signInWithEmailAndPassword(auth, 'student@taskify.com', 'Test1234!');
      studentUid = cred.user.uid;
      console.log('  Signed in as existing user, UID:', studentUid);
    } else {
      throw err;
    }
  }

  // ── 2. Create student user profile ──
  await setDoc(doc(db, 'users', studentUid), {
    name: 'Aryan Sharma',
    email: 'student@taskify.com',
    role: 'student',
    room: 'Room 4B',
    totalPoints: 1250,
    monthlyPoints: 840,
    totalTasks: 47,
    streak: 5,
    level: 12,
    joinDate: Timestamp.fromDate(new Date('2025-08-01')),
    avatarColor: '#FFB300',
  });
  console.log('✅ Created user profile for Aryan Sharma');

  // ── 3. Create additional students for leaderboard ──
  const otherStudents = [
    { id: 'student2', name: 'Arjun Mehta', email: 'arjun@taskify.com', room: 'Room 3A', totalPoints: 1500, monthlyPoints: 920, totalTasks: 52, streak: 8, level: 14, avatarColor: '#64B5F6' },
    { id: 'student3', name: 'Priya Sharma', email: 'priya@taskify.com', room: 'Room 2C', totalPoints: 1100, monthlyPoints: 760, totalTasks: 38, streak: 3, level: 10, avatarColor: '#FF8A65' },
    { id: 'student4', name: 'Rahul Nair', email: 'rahul@taskify.com', room: 'Room 1A', totalPoints: 980, monthlyPoints: 680, totalTasks: 35, streak: 2, level: 9, avatarColor: '#81C784' },
    { id: 'student5', name: 'Sneha Patil', email: 'sneha@taskify.com', room: 'Room 3B', totalPoints: 850, monthlyPoints: 620, totalTasks: 30, streak: 1, level: 8, avatarColor: '#B0BEC5' },
  ];

  for (const s of otherStudents) {
    await setDoc(doc(db, 'users', s.id), {
      name: s.name,
      email: s.email,
      role: 'student',
      room: s.room,
      totalPoints: s.totalPoints,
      monthlyPoints: s.monthlyPoints,
      totalTasks: s.totalTasks,
      streak: s.streak,
      level: s.level,
      joinDate: Timestamp.fromDate(new Date('2025-08-01')),
      avatarColor: s.avatarColor,
    });
    console.log(`✅ Created user profile for ${s.name}`);
  }

  // ── 4. Create tasks ──
  const now = new Date();
  const tasks = [
    { title: 'Library assignment log', description: 'Complete and submit your library assignment log for the week.', category: 'Academic', points: 50, deadline: new Date(now.getTime() + 2 * 86400000) },
    { title: 'Morning room cleanup', description: 'Clean and organize your dorm room before morning inspection.', category: 'Domestic', points: 30, deadline: new Date(now.getTime() + 1 * 86400000) },
    { title: 'Morning PT session', description: 'Attend the morning physical training session.', category: 'Sports', points: 35, deadline: new Date(now.getTime() + 3 * 86400000) },
    { title: 'Special event volunteer', description: 'Volunteer for the upcoming cultural event organization.', category: 'Special', points: 150, deadline: new Date(now.getTime() + 9 * 86400000) },
    { title: 'Math tutorial', description: 'Complete the math tutorial worksheet and submit.', category: 'Academic', points: 60, deadline: new Date(now.getTime() + 4 * 86400000) },
    { title: 'Weekend campus sweep', description: 'Participate in the weekend campus cleaning drive.', category: 'Domestic', points: 40, deadline: new Date(now.getTime() + 5 * 86400000) },
  ];

  const taskIds: string[] = [];
  for (const t of tasks) {
    const ref = await addDoc(collection(db, 'tasks'), {
      title: t.title,
      description: t.description,
      category: t.category,
      points: t.points,
      deadline: Timestamp.fromDate(t.deadline),
      createdBy: 'admin',
      createdAt: Timestamp.now(),
      status: 'active',
    });
    taskIds.push(ref.id);
    console.log(`✅ Created task: ${t.title}`);
  }

  // ── 5. Create submissions for the test student ──
  const submissions = [
    { taskIdx: 4, taskTitle: 'Math tutorial', taskCategory: 'Academic', taskPoints: 60, status: 'rejected', daysAgo: 6 },
    { taskIdx: 5, taskTitle: 'Weekend campus sweep', taskCategory: 'Domestic', taskPoints: 40, status: 'pending', daysAgo: 2 },
    { taskIdx: 1, taskTitle: 'Morning room cleanup', taskCategory: 'Domestic', taskPoints: 30, status: 'approved', daysAgo: 5 },
    { taskIdx: 0, taskTitle: 'Library assignment log', taskCategory: 'Academic', taskPoints: 50, status: 'approved', daysAgo: 8 },
  ];

  for (const s of submissions) {
    await addDoc(collection(db, 'submissions'), {
      taskId: taskIds[s.taskIdx] || 'unknown',
      studentId: studentUid,
      taskTitle: s.taskTitle,
      taskCategory: s.taskCategory,
      taskPoints: s.taskPoints,
      submittedAt: Timestamp.fromDate(new Date(now.getTime() - s.daysAgo * 86400000)),
      status: s.status,
      ...(s.status !== 'pending' ? {
        reviewedBy: 'admin',
        reviewedAt: Timestamp.fromDate(new Date(now.getTime() - (s.daysAgo - 1) * 86400000)),
      } : {}),
    });
    console.log(`✅ Created submission: ${s.taskTitle} (${s.status})`);
  }

  // ── 6. Create reward store items ──
  const rewards = [
    { title: 'Movie Ticket', description: 'A ticket to the weekend movie screening.', pointsCost: 500, imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80', active: true },
    { title: 'Mobile Recharge', description: '₹100 mobile recharge voucher.', pointsCost: 300, imageUrl: 'https://images.unsplash.com/photo-1544866092-1935c5ef2a8f?w=500&q=80', active: true },
  ];

  for (const r of rewards) {
    await addDoc(collection(db, 'rewards'), r);
    console.log(`✅ Created reward: ${r.title}`);
  }

  // ── 7. Create monthly reward ──
  await setDoc(doc(db, 'settings', 'monthlyReward'), {
    title: 'Premium Lounge Access',
    description: 'Top 3 performers get exclusive access to the student lounge for a week!',
    month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  });
  console.log('✅ Created monthly reward');

  console.log('\n🎉 Seed complete!');
  console.log('   Login: student@taskify.com / Test1234!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
