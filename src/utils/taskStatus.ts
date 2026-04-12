export type TaskDurationType = 'minutes' | 'hours' | 'days';

type TaskLike = {
  createdAt?: string | Date | null;
  duration?: number | null;
  durationType?: TaskDurationType | null;
};

export type TaskStatus = 'active' | 'expired';

const getDateFromValue = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const getTaskEndTime = (task: TaskLike): Date | null => {
  const createdAt = getDateFromValue(task.createdAt ?? null);
  const duration = Number(task.duration ?? 0);
  const durationType = task.durationType;

  if (!createdAt || !duration || duration <= 0 || !durationType) {
    return null;
  }

  const end = new Date(createdAt);
  if (durationType === 'minutes') end.setMinutes(end.getMinutes() + duration);
  if (durationType === 'hours') end.setHours(end.getHours() + duration);
  if (durationType === 'days') end.setDate(end.getDate() + duration);
  return end;
};

export const getTaskStatus = (task: TaskLike): TaskStatus => {
  const endTime = getTaskEndTime(task);
  if (!endTime) return 'active';
  return endTime.getTime() > Date.now() ? 'active' : 'expired';
};

export const getTaskStatusLabel = (task: TaskLike): string => {
  const endTime = getTaskEndTime(task);
  if (!endTime) return '';

  const diffMs = endTime.getTime() - Date.now();
  if (diffMs <= 0) return '🔴 Expired';

  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 60) return `⏳ Ends in ${totalMinutes}m`;

  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) return `⏳ Ends in ${totalHours}h`;

  const totalDays = Math.floor(totalHours / 24);
  return `⏳ Ends in ${totalDays}d`;
};
