import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as a relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Less than a day
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours === 0) {
      // Less than an hour
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes === 0) {
        return 'just now';
      } else {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else {
    // Format as MM/DD/YYYY for older dates
    return date.toLocaleDateString();
  }
}

/**
 * Format a date as "YYYY-MM-DD" for input fields
 */
export function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Calculate remaining vacation days
 */
export function calculateVacationDays(vacationUntil: string | null): number {
  if (!vacationUntil) return 0;
  
  const vacationDate = new Date(vacationUntil);
  const now = new Date();
  
  // If vacation is in the past, return 0
  if (vacationDate < now) return 0;
  
  // Calculate days difference
  const diffMs = vacationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Create a two weeks from now date
 */
export function getTwoWeeksFromNow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date;
}
