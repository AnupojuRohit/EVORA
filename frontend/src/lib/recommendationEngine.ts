/**
 * Smart Slot Recommendation Engine
 * Provides AI-ready rule-based slot recommendations
 */

export interface Slot {
  id: string
  start_time: string
  end_time: string
  is_available: boolean
  is_emergency_reserved?: boolean
}

export interface Charger {
  id: string
  charger_type: string
  power_kw: number
  price_per_hour: number
  name?: string
  slots: Slot[]
}

export type RecommendationType = "fastest" | "least_busy" | "cost_optimized"

export interface SlotRecommendation {
  slot: Slot
  charger: Charger
  type: RecommendationType
  reason: string
  estimatedCost: number
  priority: number
}

// Off-peak hours (typically cheaper)
const OFF_PEAK_HOURS = [0, 1, 2, 3, 4, 5, 6, 22, 23]

// Check if a slot is during off-peak hours
const isOffPeakSlot = (slot: Slot): boolean => {
  const hour = new Date(slot.start_time).getHours()
  return OFF_PEAK_HOURS.includes(hour)
}

// Calculate slot duration in hours
const getSlotDuration = (slot: Slot): number => {
  const start = new Date(slot.start_time).getTime()
  const end = new Date(slot.end_time).getTime()
  return (end - start) / 3600000
}

// Get earliest available slot across all chargers
const getFastestSlot = (chargers: Charger[]): SlotRecommendation | null => {
  let earliest: { slot: Slot; charger: Charger } | null = null
  let earliestTime = Infinity

  for (const charger of chargers) {
    for (const slot of charger.slots) {
      if (!slot.is_available || slot.is_emergency_reserved) continue
      
      const startTime = new Date(slot.start_time).getTime()
      if (startTime < earliestTime) {
        earliestTime = startTime
        earliest = { slot, charger }
      }
    }
  }

  if (!earliest) return null

  const duration = getSlotDuration(earliest.slot)
  return {
    slot: earliest.slot,
    charger: earliest.charger,
    type: "fastest",
    reason: "Fastest Available",
    estimatedCost: duration * earliest.charger.price_per_hour,
    priority: 1,
  }
}

// Get slot with lowest booking density (simulated by finding charger with most available slots)
const getLeastBusySlot = (chargers: Charger[]): SlotRecommendation | null => {
  let bestCharger: Charger | null = null
  let maxAvailableCount = 0

  for (const charger of chargers) {
    const availableCount = charger.slots.filter(
      s => s.is_available && !s.is_emergency_reserved
    ).length
    
    if (availableCount > maxAvailableCount) {
      maxAvailableCount = availableCount
      bestCharger = charger
    }
  }

  if (!bestCharger) return null

  // Get the first available slot from the least busy charger
  const slot = bestCharger.slots.find(s => s.is_available && !s.is_emergency_reserved)
  if (!slot) return null

  const duration = getSlotDuration(slot)
  return {
    slot,
    charger: bestCharger,
    type: "least_busy",
    reason: "Least Busy Charger",
    estimatedCost: duration * bestCharger.price_per_hour,
    priority: 2,
  }
}

// Get lowest cost slot (off-peak + lowest price charger)
const getCostOptimizedSlot = (chargers: Charger[]): SlotRecommendation | null => {
  let bestOption: { slot: Slot; charger: Charger; cost: number } | null = null

  for (const charger of chargers) {
    for (const slot of charger.slots) {
      if (!slot.is_available || slot.is_emergency_reserved) continue

      const duration = getSlotDuration(slot)
      let cost = duration * charger.price_per_hour

      // Apply 20% discount for off-peak slots (simulated)
      if (isOffPeakSlot(slot)) {
        cost *= 0.8
      }

      if (!bestOption || cost < bestOption.cost) {
        bestOption = { slot, charger, cost }
      }
    }
  }

  if (!bestOption) return null

  const isOffPeak = isOffPeakSlot(bestOption.slot)
  return {
    slot: bestOption.slot,
    charger: bestOption.charger,
    type: "cost_optimized",
    reason: isOffPeak ? "Off-Peak Discount" : "Best Value",
    estimatedCost: bestOption.cost,
    priority: 3,
  }
}

/**
 * Get all slot recommendations for a given set of chargers
 */
export const getSlotRecommendations = (chargers: Charger[]): SlotRecommendation[] => {
  const recommendations: SlotRecommendation[] = []

  const fastest = getFastestSlot(chargers)
  if (fastest) recommendations.push(fastest)

  const leastBusy = getLeastBusySlot(chargers)
  // Only add if different from fastest
  if (leastBusy && leastBusy.slot.id !== fastest?.slot.id) {
    recommendations.push(leastBusy)
  }

  const costOptimized = getCostOptimizedSlot(chargers)
  // Only add if different from others
  if (
    costOptimized &&
    costOptimized.slot.id !== fastest?.slot.id &&
    costOptimized.slot.id !== leastBusy?.slot.id
  ) {
    recommendations.push(costOptimized)
  }

  return recommendations.sort((a, b) => a.priority - b.priority)
}

/**
 * Get the top recommendation
 */
export const getTopRecommendation = (chargers: Charger[]): SlotRecommendation | null => {
  const recommendations = getSlotRecommendations(chargers)
  return recommendations[0] || null
}

/**
 * Format recommendation type for display
 */
export const getRecommendationLabel = (type: RecommendationType): string => {
  switch (type) {
    case "fastest":
      return "⚡ Fastest Available"
    case "least_busy":
      return "🎯 Least Busy"
    case "cost_optimized":
      return "💰 Best Value"
    default:
      return "Recommended"
  }
}

/**
 * Get recommendation badge color
 */
export const getRecommendationColor = (type: RecommendationType): string => {
  switch (type) {
    case "fastest":
      return "from-emerald-500 to-cyan-500"
    case "least_busy":
      return "from-purple-500 to-pink-500"
    case "cost_optimized":
      return "from-amber-500 to-orange-500"
    default:
      return "from-emerald-500 to-cyan-500"
  }
}
