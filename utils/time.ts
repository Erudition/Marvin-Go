

export function formatDurationCompact(seconds: number): string {
  if (seconds === 0) return '0m';
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  // Optional: include seconds if needed, but request asked for "2h 5m"
  if (hours === 0 && minutes === 0) return `${seconds}s`;
  
  return parts.join(' ');
}

export function getCurrentTimeStr(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function parseNaturalLanguageTime(input: string): number | null {
  const now = Date.now();
  const lower = input.toLowerCase().trim();

  if (lower === 'now') return now;

  // Try parsing absolute time HH:mm (e.g. "14:30", "2:30pm")
  const timeRegex = /^(\d{1,2})[:.](\d{2})(?:\s*(am|pm))?$/;
  const timeMatch = lower.match(timeRegex);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3];

    if (period) {
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // If time is in the future, assume it meant yesterday (since tasks are done in past)
    if (date.getTime() > now + 60000) { // allowance for slight clock skew
       date.setDate(date.getDate() - 1);
    }
    return date.getTime();
  }

  // Try parsing relative duration e.g. "1h", "30m", "10m ago"
  let durationMs = 0;
  const hours = lower.match(/(\d+)\s*h/);
  const minutes = lower.match(/(\d+)\s*m/);
  const seconds = lower.match(/(\d+)\s*s/);

  if (hours) durationMs += parseInt(hours[1], 10) * 3600000;
  if (minutes) durationMs += parseInt(minutes[1], 10) * 60000;
  if (seconds) durationMs += parseInt(seconds[1], 10) * 1000;

  if (durationMs > 0) return now - durationMs;

  return null;
}

export interface Session {
    start: number;
    end?: number;
}

export function groupSessions(times: number[] | undefined): Session[] {
    if (!times || times.length === 0) return [];
    const sessions: Session[] = [];
    for (let i = 0; i < times.length; i += 2) {
        sessions.push({
            start: times[i],
            end: times[i+1] // undefined if currently running (last element of odd length array)
        });
    }
    return sessions;
}

export function formatSessionHistory(times: number[] | undefined): string {
    const sessions = groupSessions(times);
    if (sessions.length === 0) return "No recorded sessions.";
    
    return sessions.map(s => {
        const startStr = new Date(s.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const endStr = s.end ? new Date(s.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Running";
        const dur = s.end ? formatDurationCompact(Math.round((s.end - s.start)/1000)) : "Active";
        return `[${startStr} - ${endStr}: ${dur}]`;
    }).join(', ');
}