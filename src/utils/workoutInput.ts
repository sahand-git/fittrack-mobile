export function parseWorkoutDuration(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 360 ? minutes : null;
}
