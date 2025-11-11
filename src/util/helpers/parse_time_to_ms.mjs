// parseTimeStringToMs.js (or inline in the command)
export function parse_time_to_ms(timeStr) {
  // "1:27.345" => match[1]=1, match[2]=27, match[3]=345
  const match = timeStr.match(/^([0-8]):([0-5]\d)\.(\d{3})$/);
  if (!match) return null;
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  const ms   = parseInt(match[3], 10);
  return mins * 60_000 + secs * 1_000 + ms;
}