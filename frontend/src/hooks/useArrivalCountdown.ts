import { useState, useEffect, useMemo, useCallback } from "react"

interface ArrivalCountdownResult {
  /** Formatted time remaining (mm:ss) */
  remainingTimeFormatted: string
  /** Raw milliseconds remaining */
  remainingMs: number
  /** Whether the arrival window has expired */
  isExpired: boolean
  /** Whether we're still before the slot start time */
  isBeforeSlotStart: boolean
  /** Time until slot starts (if before slot start) */
  timeUntilSlotStart: number | null
  /** Formatted time until slot starts */
  timeUntilSlotStartFormatted: string
  /** The computed arrival deadline timestamp */
  arrivalDeadline: number | null
  /** Whether timer is in warning zone (< 5 minutes remaining) */
  isWarning: boolean
}

/**
 * Parse datetime string handling UTC timezone
 */
function parseUTCDateTime(dateStr: string): number {
  let timeStr = dateStr
  if (!timeStr.endsWith('Z') && !timeStr.includes('+') && !timeStr.includes('-', 10)) {
    timeStr = timeStr.replace(' ', 'T')
    if (!timeStr.endsWith('Z')) {
      timeStr += 'Z'
    }
  }
  return new Date(timeStr).getTime()
}

/**
 * Hook to calculate and continuously update arrival countdown timer
 * 
 * @param createdAt - ISO string of when the booking was created (for 20 min countdown from booking)
 * @param arrivalWindowMinutes - Minutes allowed for arrival (default: 20)
 * @param slotStartTime - Optional: ISO string of when the slot starts (for display purposes)
 * @returns Countdown state including formatted time, expiration status, and raw values
 * 
 * Timer Logic:
 * - arrivalDeadline = created_at + arrival_window_minutes (20 min from booking)
 * - Countdown shows time remaining until deadline
 * - If current time >= arrivalDeadline: shows expired
 */
export function useArrivalCountdown(
  createdAt: string | undefined | null,
  arrivalWindowMinutes: number = 20,
  slotStartTime?: string | null
): ArrivalCountdownResult {
  const [now, setNow] = useState(Date.now())

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Calculate all values based on current time
  const result = useMemo((): ArrivalCountdownResult => {
    // Default/fallback values
    const defaultResult: ArrivalCountdownResult = {
      remainingTimeFormatted: "00:00",
      remainingMs: 0,
      isExpired: false,
      isBeforeSlotStart: false,
      timeUntilSlotStart: null,
      timeUntilSlotStartFormatted: "00:00",
      arrivalDeadline: null,
      isWarning: false,
    }

    if (!createdAt) {
      return defaultResult
    }

    // Parse created_at time (this is when the booking was made)
    const bookingTime = parseUTCDateTime(createdAt)
    
    // Validate the date
    if (isNaN(bookingTime)) {
      return defaultResult
    }

    // Calculate arrival deadline: booking_time + 20 minutes
    const arrivalDeadline = bookingTime + arrivalWindowMinutes * 60 * 1000
    
    // Calculate remaining time
    const remainingMs = arrivalDeadline - now
    
    // Parse slot start time if provided
    let slotStart: number | null = null
    let timeUntilSlotStart: number | null = null
    if (slotStartTime) {
      slotStart = parseUTCDateTime(slotStartTime)
      if (!isNaN(slotStart)) {
        timeUntilSlotStart = slotStart - now
      }
    }
    
    // Determine state
    const isBeforeSlotStart = slotStart ? now < slotStart : false
    const isExpired = remainingMs <= 0
    const isWarning = !isExpired && remainingMs < 5 * 60 * 1000

    // Format time helper
    const formatTime = (ms: number): string => {
      if (ms <= 0) return "00:00"
      const totalSeconds = Math.floor(ms / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    }

    return {
      remainingTimeFormatted: formatTime(remainingMs),
      remainingMs: Math.max(0, remainingMs),
      isExpired,
      isBeforeSlotStart,
      timeUntilSlotStart,
      timeUntilSlotStartFormatted: timeUntilSlotStart ? formatTime(timeUntilSlotStart) : "00:00",
      arrivalDeadline,
      isWarning,
    }
  }, [createdAt, slotStartTime, arrivalWindowMinutes, now])

  return result
}

export default useArrivalCountdown
