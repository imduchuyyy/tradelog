import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detect trading session based on UTC hour of a given date.
 *
 * Standard forex/crypto session windows (GMT/UTC):
 *   Sydney:   21:00 – 06:00  (wraps midnight)
 *   Tokyo:    00:00 – 09:00
 *   London:   07:00 – 16:00
 *   New York: 12:00 – 21:00
 *
 * When sessions overlap the dominant/higher-volume session wins:
 *   London + New York overlap (12:00–16:00) → new_york
 *   Tokyo + London overlap (07:00–09:00)    → london
 *   Sydney + Tokyo overlap (00:00–06:00)    → tokyo
 */
export function getSessionFromDate(date: Date): "sydney" | "tokyo" | "london" | "new_york" {
  const hour = date.getUTCHours()

  // New York: 12:00 – 20:59 UTC  (also covers London/NY overlap)
  if (hour >= 12 && hour < 21) return "new_york"

  // London: 07:00 – 11:59 UTC  (also covers Tokyo/London overlap)
  if (hour >= 7 && hour < 12) return "london"

  // Tokyo: 00:00 – 06:59 UTC  (also covers Sydney/Tokyo overlap)
  if (hour >= 0 && hour < 7) return "tokyo"

  // Sydney: 21:00 – 23:59 UTC  (the non-overlapping tail)
  return "sydney"
}
