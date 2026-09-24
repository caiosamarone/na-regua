/** "3 h" / "90 min" for a cancellation lead time in minutes. */
export function leadTimeText(minutes: number) {
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;
}
