import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(currency: string) {
  const map: Record<string, string> = {
    PHP: "₱",
    USD: "$",
    EUR: "€",
    GBP: "£"
  };
  return map[currency] || "$";
}

export function formatCurrency(amount: number, currency: string = "USD") {
  return `${getCurrencySymbol(currency)}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getPayPeriodDate(targetDate: string, payDays: number[]): Date | null {
  if (!targetDate || !payDays || payDays.length === 0) return null;
  const [year, month, day] = targetDate.split('-').map(Number);
  const sortedDays = [...payDays].sort((a, b) => a - b);
  const y = year, m = month - 1, d = day;
  
  let pDate = null;
  for (let i = sortedDays.length - 1; i >= 0; i--) {
    if (d >= sortedDays[i]) {
      pDate = new Date(Date.UTC(y, m, sortedDays[i]));
      break;
    }
  }
  if (!pDate) {
    pDate = new Date(Date.UTC(y, m - 1, sortedDays[sortedDays.length - 1]));
  }
  return pDate;
}

export function formatPayPeriodLabel(label?: string) {
  if (!label) return "";
  const parts = label.trim().split(' ');
  const dayStr = parts[parts.length - 1];
  const day = parseInt(dayStr);
  if (isNaN(day)) return label;
  
  const j = day % 10, k = day % 100;
  if (j === 1 && k !== 11) return day + "st";
  if (j === 2 && k !== 12) return day + "nd";
  if (j === 3 && k !== 13) return day + "rd";
  return day + "th";
}
