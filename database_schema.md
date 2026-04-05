# Database Schema - TASKIFY (Firestore)

This document outlines the collections and document structures used in the Firestore database for the TASKIFY application.

## 1. `users` Collection
Stores profile information for all registered users (Students and Admins).

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Unique User ID (matches Firebase Auth UID) |
| `name` | string | Full name of the user |
| `email` | string | User's email address |
| `role` | string | Role of the user (`student` or `admin`) |
| `room` | string | Assigned room/group identifier |
| `totalPoints` | number | Cumulative points earned by the user |
| `monthlyPoints` | number | Points earned in the current month |
| `totalTasks` | number | Number of tasks successfully completed |
| `streak` | number | Current daily activity streak |
| `level` | number | User's current level (gamification) |
| `joinDate` | string | ISO Timestamp of account creation |
| `avatarColor` | string | Hex code for user's profile avatar color |

## 2. `tasks` Collection
Stores the tasks created by administrators.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique document ID |
| `title` | string | Task title |
| `description` | string | Detailed task requirements |
| `category` | string | Category (`Academic`, `Domestic`, `Sports`, `Special`) |
| `points` | number | Points awarded for completion |
| `deadline` | string | ISO Timestamp for task expiry |
| `createdBy` | string | UID of the admin who created the task |
| `createdAt` | string | ISO Timestamp of task creation |
| `status` | string | Task status (`active` or `archived`) |

## 3. `submissions` Collection
Stores task completions submitted by students.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique document ID |
| `taskId` | string | ID of the linked task |
| `taskTitle` | string | Denormalized task title (for display) |
| `taskCategory` | string | Denormalized task category (for display) |
| `taskPoints` | number | Points assigned for this submission |
| `studentId` | string | UID of the student who submitted |
| `submittedAt` | string | ISO Timestamp of submission |
| `status` | string | Submission status (`pending`, `approved`, `rejected`) |
| `reviewedBy` | string (opt) | UID of the admin who reviewed it |
| `reviewedAt` | string (opt) | ISO Timestamp of review |

## 4. `rewards` Collection
Stores items available for redemption.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique document ID |
| `title` | string | Reward title |
| `description` | string | Detailed reward description |
| `pointsCost` | number | Points required for redemption |
| `imageUrl` | string | URL of the reward icon/image |
| `active` | boolean | Whether the reward is currently available |

## 5. `settings` Collection
Global configuration settings.

| Field | Type | Description |
|-------|------|-------------|
| `monthlyReward` | object | Contains `title`, `description`, and `month` for current goal |
