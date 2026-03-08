import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  X,
  Zap,
  Clock,
  Car,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { carAPI } from "@/lib/api"

interface EmergencyBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EmergencyBookingData) => Promise<void>
  stationId?: string
  stationName?: string
  preselectedChargerId?: string
}

export interface EmergencyBookingData {
  vehicleNumber: string
  carId?: string
  chargerType: "AC" | "DC" | "Ultra-Fast"
  estimatedDuration: number // in minutes
  stationId: string
  notes?: string
}

const chargerTypes = [
  { id: "AC", label: "Standard (AC)", power: "7-22 kW", time: "4-8 hrs" },
  { id: "DC", label: "Fast (DC)", power: "50-150 kW", time: "30-60 min" },
  { id: "Ultra-Fast", label: "Ultra-Fast", power: "150-350 kW", time: "15-30 min" },
]

const durationOptions = [15, 30, 45, 60, 90, 120]

export const EmergencyBookingModal = ({
  isOpen,
  onClose,
  onSubmit,
  stationId = "",
  stationName = "Station",
  preselectedChargerId,
}: EmergencyBookingModalProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const [chargerType, setChargerType] = useState<"AC" | "DC" | "Ultra-Fast">("DC")
  const [duration, setDuration] = useState(30)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [userCars, setUserCars] = useState<any[]>([])
  const [loadingCars, setLoadingCars] = useState(true)

  // Load user's cars
  useEffect(() => {
    if (isOpen) {
      carAPI.getCars()
        .then(res => {
          setUserCars(res.data || [])
          // Auto-fill first car
          if (res.data?.[0]) {
            setVehicleNumber(res.data[0].registration_number || "")
            setSelectedCarId(res.data[0].id)
          }
        })
        .catch(() => setUserCars([]))
        .finally(() => setLoadingCars(false))
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleCarSelect = (car: any) => {
    setSelectedCarId(car.id)
    setVehicleNumber(car.registration_number || "")
  }

  const handleSubmit = async () => {
    if (!vehicleNumber.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        carId: selectedCarId || undefined,
        chargerType,
        estimatedDuration: duration,
        stationId,
        notes: notes.trim() || undefined,
      })
      setIsSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Emergency booking failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg rounded-3xl border border-amber-500/30 bg-[#0a1016] overflow-hidden shadow-[0_30px_80px_-30px_rgba(245,158,11,0.3)]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Emergency Charging Request</h2>
                  <p className="text-sm text-white/50 mt-0.5">{stationName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">Request Submitted!</h3>
              <p className="text-white/50 text-sm">
                Waiting for station approval. You'll be notified once your slot is confirmed.
              </p>
            </div>
          ) : (
            <>
              {/* Content */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Vehicle Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 flex items-center gap-2">
                    <Car className="w-4 h-4" /> Vehicle
                  </label>
                  
                  {/* User's saved cars */}
                  {!loadingCars && userCars.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {userCars.map((car) => (
                        <button
                          key={car.id}
                          onClick={() => handleCarSelect(car)}
                          className={`px-3 py-2 rounded-xl border text-sm transition ${
                            selectedCarId === car.id
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          {car.registration_number || car.model}
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="Enter vehicle number (e.g., TS09AB1234)"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </div>

                {/* Charger Type */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Charger Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {chargerTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setChargerType(type.id as any)}
                        className={`p-3 rounded-xl border text-left transition ${
                          chargerType === type.id
                            ? "bg-amber-500/20 border-amber-500/50"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <p className={`text-sm font-medium ${chargerType === type.id ? "text-amber-300" : "text-white"}`}>
                          {type.label}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5">{type.power}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Estimated Duration
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {durationOptions.map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setDuration(mins)}
                        className={`px-4 py-2 rounded-xl border text-sm transition ${
                          duration === mins
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Additional Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requirements..."
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 resize-none"
                  />
                </div>

                {/* Info Banner */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-amber-200 font-medium">Emergency Priority</p>
                      <p className="text-white/50 mt-1">
                        Your request will be sent to the station operator for immediate processing. 
                        You'll receive confirmation within 5 minutes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-[#080c10]">
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-white/10 py-3 text-white/70 hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!vehicleNumber.trim() || isSubmitting}
                    className={`flex-1 rounded-xl py-3 font-medium flex items-center justify-center gap-2 transition ${
                      vehicleNumber.trim() && !isSubmitting
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        Request Emergency Slot
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EmergencyBookingModal
