export function getPayPeriodForDate(targetDate: string, payDays: number[]): string {
  if (!targetDate || !payDays || payDays.length === 0) return "";
  // Parse date assuming local time to avoid timezone offset issues with YYYY-MM-DD
  const [year, month, day] = targetDate.split('-').map(Number);
  const d = day;
  const m = month - 1; // 0-indexed month
  const y = year;

  const sortedDays = [...payDays].sort((a, b) => a - b);
  
  let resultDate: Date | null = null;

  for (let i = sortedDays.length - 1; i >= 0; i--) {
    if (d >= sortedDays[i]) {
      resultDate = new Date(y, m, sortedDays[i]);
      break;
    }
  }

  if (!resultDate) {
    resultDate = new Date(y, m - 1, sortedDays[sortedDays.length - 1]);
  }

  return resultDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
