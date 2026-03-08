import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Battery, Zap, Clock, Calculator, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import {
  calculateChargingTime,
  getBatteryCapacity,
  DEFAULT_BATTERY_CAPACITIES,
  ChargingPrediction,
} from "@/lib/chargingCalculator"

interface ChargingCompletionPredictorProps {
  vehicleModel?: string
  chargerPowerKw?: number
  onPredictionChange?: (prediction: ChargingPrediction | null) => void
}

export const ChargingCompletionPredictor = ({
  vehicleModel,
  chargerPowerKw = 0,
  onPredictionChange,
}: ChargingCompletionPredictorProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [currentBattery, setCurrentBattery] = useState<number>(20)
  const [targetBattery, setTargetBattery] = useState<number>(80)
  const [batteryCapacity, setBatteryCapacity] = useState<number>(40)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Update battery capacity when vehicle model changes
  useEffect(() => {
    if (vehicleModel) {
      const capacity = getBatteryCapacity(vehicleModel)
      setBatteryCapacity(capacity)
    }
  }, [vehicleModel])

  // Calculate prediction
  const prediction = useMemo(() => {
    if (currentBattery >= targetBattery || chargerPowerKw <= 0) {
      return null
    }

    return calculateChargingTime({
      currentBatteryPercent: currentBattery,
      targetBatteryPercent: targetBattery,
      batteryCapacityKwh: batteryCapacity,
      chargerPowerKw,
    })
  }, [currentBattery, targetBattery, batteryCapacity, chargerPowerKw])

  // Notify parent of prediction changes
  useEffect(() => {
    onPredictionChange?.(prediction)
  }, [prediction, onPredictionChange])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 rounded-t-3xl px-6 py-4 flex items-center justify-between hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white flex items-center gap-2">
              Charging Time Predictor
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 uppercase tracking-wider">
                Smart
              </span>
            </h3>
            <p className="text-xs text-white/60">
              Estimate your charging completion time
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-white/60" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/60" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.04] border-x border-b border-white/10 rounded-b-3xl p-6 space-y-5">
              {/* Battery Inputs */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current Battery */}
                <div className="space-y-2">
                  <label className="text-xs text-white/60 flex items-center gap-1.5">
                    <Battery className="w-3.5 h-3.5" />
                    Current Battery %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={currentBattery}
                      onChange={(e) => setCurrentBattery(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">%</span>
                  </div>
                  {/* Quick select */}
                  <div className="flex gap-1.5">
                    {[10, 20, 30, 40].map((val) => (
                      <button
                        key={val}
                        onClick={() => setCurrentBattery(val)}
                        className={`flex-1 py-1 text-xs rounded-lg transition ${
                          currentBattery === val
                            ? "bg-blue-500/30 text-blue-300 border border-blue-400/30"
                            : "bg-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Battery */}
                <div className="space-y-2">
                  <label className="text-xs text-white/60 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Target Battery %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={targetBattery}
                      onChange={(e) => setTargetBattery(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">%</span>
                  </div>
                  {/* Quick select */}
                  <div className="flex gap-1.5">
                    {[60, 80, 90, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => setTargetBattery(val)}
                        className={`flex-1 py-1 text-xs rounded-lg transition ${
                          targetBattery === val
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/30"
                            : "bg-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced: Battery Capacity */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs text-white/50 hover:text-white/70 transition"
                >
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Advanced Settings
                </button>
                
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        <label className="text-xs text-white/60">
                          Battery Capacity (kWh)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={10}
                            max={150}
                            value={batteryCapacity}
                            onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-400/50 focus:outline-none transition"
                          />
                          <select
                            onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none"
                          >
                            <option value="">Presets</option>
                            {Object.entries(DEFAULT_BATTERY_CAPACITIES)
                              .filter(([key]) => key !== "default")
                              .map(([model, capacity]) => (
                                <option key={model} value={capacity}>
                                  {model} ({capacity} kWh)
                                </option>
                              ))}
                          </select>
                        </div>
                        {vehicleModel && (
                          <p className="text-xs text-white/40">
                            Auto-detected from {vehicleModel}: {getBatteryCapacity(vehicleModel)} kWh
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Charger Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <Zap className="w-5 h-5 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-xs text-white/50">Selected Charger Power</p>
                  <p className="text-lg font-bold text-white">
                    {chargerPowerKw > 0 ? `${chargerPowerKw} kW` : "No charger selected"}
                  </p>
                </div>
              </div>

              {/* Prediction Result */}
              {prediction && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs uppercase tracking-wider text-emerald-300">
                      Prediction
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/50 mb-1">Estimated Duration</p>
                      <p className="text-2xl font-bold text-white">
                        {prediction.durationFormatted}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1">Completion Time</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {prediction.completionTimeFormatted}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="text-white/50">Energy Required</span>
                    <span className="text-white font-medium">{prediction.energyNeededKwh} kWh</span>
                  </div>

                  {targetBattery > 80 && (
                    <p className="mt-3 text-xs text-amber-300/80 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Charging above 80% is slower due to battery protection
                    </p>
                  )}
                </motion.div>
              )}

              {/* No prediction message */}
              {!prediction && chargerPowerKw > 0 && currentBattery >= targetBattery && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-center">
                  <p className="text-sm text-amber-300">
                    Target battery must be higher than current battery
                  </p>
                </div>
              )}

              {!prediction && chargerPowerKw <= 0 && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                  <p className="text-sm text-white/50">
                    Select a charger to see charging time prediction
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ChargingCompletionPredictor
