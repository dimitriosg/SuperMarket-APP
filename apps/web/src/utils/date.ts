export const STALE_THRESHOLD_DAYS = 7;

export const isStale = (dateStr: string | undefined): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  return diffInDays > STALE_THRESHOLD_DAYS;
};

export const getRelativeTime = (dateStr: string | undefined) => {
  if (!dateStr) return { text: "", isStale: false };
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  const isStaleCalc = diffInDays > STALE_THRESHOLD_DAYS;

  if (diffInHours < 1) return { text: "Μόλις τώρα", isStale: isStaleCalc };
  if (diffInHours < 24) return { text: `Πριν ${diffInHours} ώρες`, isStale: isStaleCalc };
  if (diffInDays === 1) return { text: "Χθες", isStale: isStaleCalc };
  if (diffInDays < 30) return { text: `Πριν ${diffInDays} μέρες`, isStale: isStaleCalc };
  
  return { text: "Πριν >1 μήνα", isStale: isStaleCalc };
};