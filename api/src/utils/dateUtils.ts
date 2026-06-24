export function getKstDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function getBusinessDateString(date: Date = new Date()): string {
  const d = new Date(date);
  const hour = parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    hour12: false
  }).format(d), 10);
  
  // 5 AM before is considered the previous day for taxi operations
  if (hour < 5 || hour === 24) {
    d.setDate(d.getDate() - 1);
  }
  
  return getKstDateString(d);
}
