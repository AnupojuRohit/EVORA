/**
 * Charging Completion Time Calculator
 * Calculates estimated charging duration and completion time based on battery parameters
 */

export interface ChargingPrediction {
  energyNeededKwh: number
  durationMinutes: number
  durationFormatted: string
  completionTime: Date
  completionTimeFormatted: string
}

export interface ChargingInputs {
  currentBatteryPercent: number
  targetBatteryPercent: number
  batteryCapacityKwh: number
  chargerPowerKw: number
}

// Default battery capacities for common EV models (in kWh)
export const DEFAULT_BATTERY_CAPACITIES: Record<string, number> = {
  "Tata Nexon EV": 40.5,
  "Tata Tiago EV": 24,
  "Tata Punch EV": 35,
  "MG ZS EV": 50.3,
  "MG Comet": 17.3,
  "Hyundai Kona Electric": 39.2,
  "Hyundai Ioniq 5": 72.6,
  "Mahindra XUV400": 39.4,
  "Mahindra BE 6": 79,
  "BYD Atto 3": 60.48,
  "Kia EV6": 77.4,
  "BMW iX": 76.6,
  "Mercedes EQS": 107.8,
  "Audi e-tron": 95,
  "default": 40, // Fallback
}

/**
 * Calculate charging completion time
 */
export function calculateChargingTime(inputs: ChargingInputs): ChargingPrediction {
  const { currentBatteryPercent, targetBatteryPercent, batteryCapacityKwh, chargerPowerKw } = inputs

  // Validate inputs
  if (currentBatteryPercent >= targetBatteryPercent) {
    return {
      energyNeededKwh: 0,
      durationMinutes: 0,
      durationFormatted: "0 min",
      completionTime: new Date(),
      completionTimeFormatted: "Already charged",
    }
  }

  if (chargerPowerKw <= 0) {
    return {
      energyNeededKwh: 0,
      durationMinutes: 0,
      durationFormatted: "--",
      completionTime: new Date(),
      completionTimeFormatted: "Select a charger",
    }
  }

  // Calculate energy needed (kWh)
  const percentDifference = targetBatteryPercent - currentBatteryPercent
  const energyNeededKwh = (batteryCapacityKwh * percentDifference) / 100

  // Calculate time needed (accounting for ~85% charging efficiency at higher states)
  // Real-world charging slows down above 80%
  let effectiveChargerPower = chargerPowerKw
  if (targetBatteryPercent > 80) {
    // Average out the reduced speed above 80%
    const percentAbove80 = Math.max(0, targetBatteryPercent - Math.max(80, currentBatteryPercent))
    const percentBelow80 = percentDifference - percentAbove80
    
    // Below 80%: full speed, Above 80%: ~60% speed
    const timeBelow80 = percentBelow80 > 0 ? (batteryCapacityKwh * percentBelow80 / 100) / chargerPowerKw : 0
    const timeAbove80 = percentAbove80 > 0 ? (batteryCapacityKwh * percentAbove80 / 100) / (chargerPowerKw * 0.6) : 0
    
    const totalHours = timeBelow80 + timeAbove80
    const durationMinutes = Math.ceil(totalHours * 60)
    
    const completionTime = new Date(Date.now() + durationMinutes * 60 * 1000)
    
    return {
      energyNeededKwh: Math.round(energyNeededKwh * 10) / 10,
      durationMinutes,
      durationFormatted: formatDuration(durationMinutes),
      completionTime,
      completionTimeFormatted: formatTime(completionTime),
    }
  }

  // Simple calculation for below 80%
  const chargingTimeHours = energyNeededKwh / effectiveChargerPower
  const durationMinutes = Math.ceil(chargingTimeHours * 60)
  
  const completionTime = new Date(Date.now() + durationMinutes * 60 * 1000)

  return {
    energyNeededKwh: Math.round(energyNeededKwh * 10) / 10,
    durationMinutes,
    durationFormatted: formatDuration(durationMinutes),
    completionTime,
    completionTimeFormatted: formatTime(completionTime),
  }
}

/**
 * Format duration in human-readable form
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "< 1 min"
  if (minutes < 60) return `${minutes} min`
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true 
  })
}

/**
 * Get battery capacity for a vehicle model
 */
export function getBatteryCapacity(model: string): number {
  // Try exact match first
  if (DEFAULT_BATTERY_CAPACITIES[model]) {
    return DEFAULT_BATTERY_CAPACITIES[model]
  }
  
  // Try partial match
  const lowerModel = model.toLowerCase()
  for (const [key, value] of Object.entries(DEFAULT_BATTERY_CAPACITIES)) {
    if (lowerModel.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerModel)) {
      return value
    }
  }
  
  return DEFAULT_BATTERY_CAPACITIES.default
}
