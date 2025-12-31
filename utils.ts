import { EXAM_DATE } from './constants';

export const getDaysRemaining = (): number => {
  const now = Date.now();
  const diff = EXAM_DATE - now;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

export const getDefconLevel = (days: number): number => {
  if (days < 30) return 1;
  if (days < 60) return 2;
  if (days < 90) return 3;
  if (days < 120) return 4;
  return 5;
};

export const formatCurrency = (val: number): string => {
  return `$NW ${val.toLocaleString()}`;
};

export const getRandomQuote = (quotes: string[]) => {
  const hour = new Date().getHours();
  // Pseudo-random based on hour to rotate directives
  return quotes[hour % quotes.length];
};