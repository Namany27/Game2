import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, symbol = "USDT"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${numAmount.toFixed(2)} ${symbol}`;
}

export function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  
  // If it's recent (within last hour), show as "just now" or "X mins ago"
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  
  return date.toLocaleString();
}

export function truncateUsername(username: string): string {
  if (username.length <= 8) return username;
  return `${username.substring(0, 5)}***`;
}

// Generate random avatar color based on username
export function getUserAvatarColor(username: string): string {
  const colors = [
    "bg-primary text-primary-foreground",
    "bg-secondary text-secondary-foreground",
    "bg-accent text-accent-foreground",
    "bg-destructive text-destructive-foreground",
    "bg-pink-600 text-white",
    "bg-purple-600 text-white",
    "bg-blue-600 text-white",
    "bg-green-600 text-white",
  ];
  
  // Generate consistent index based on username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Calculate house edge for games
export function calculateWinChance(houseEdge: number): number {
  return 100 - houseEdge;
}

// Format large numbers with K, M suffixes
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Animate count up for numbers
export function animateValue(
  callback: (value: number) => void,
  start: number,
  end: number,
  duration: number = 500
) {
  let startTimestamp: number | null = null;
  const step = (timestamp: number) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    callback(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}
