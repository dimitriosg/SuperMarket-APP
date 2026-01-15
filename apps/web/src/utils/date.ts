export const STALE_THRESHOLD_DAYS = 7;

export const isStale = (dateStr: string | undefined): boolean => {
  if (!dateStr) return false;
  const diffInDays = getDaysDiff(dateStr);
  return diffInDays > STALE_THRESHOLD_DAYS;
};

// Helper για να υπολογίζει καθαρά μέρες διαφοράς
const getDaysDiff = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  
  // Μηδενίζουμε τις ώρες για να συγκρίνουμε ημερολογιακές μέρες
  const utc1 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utc2 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / msPerDay);
};

export const getRelativeTime = (dateStr: string | undefined) => {
  if (!dateStr) return { text: "", isStale: false };
  
  const diffInDays = getDaysDiff(dateStr);
  const isStaleCalc = diffInDays > STALE_THRESHOLD_DAYS;

  if (diffInDays === 0) return { text: "Σήμερα", isStale: isStaleCalc };
  if (diffInDays === 1) return { text: "Χθες", isStale: isStaleCalc };
  if (diffInDays < 30) return { text: `Πριν ${diffInDays} μέρες`, isStale: isStaleCalc };
  
  return { text: "Πριν >1 μήνα", isStale: isStaleCalc };
};