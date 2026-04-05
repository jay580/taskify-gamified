export const isUserSuspended = (user: any) => {
  if (!user?.isSuspended) return false;

  const now = new Date();
  const end = new Date(user.suspensionEnd);

  return now < end;
};