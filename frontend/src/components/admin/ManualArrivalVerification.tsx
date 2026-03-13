import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  Search,
  QrCode,
  Car,
  Loader2,
  AlertTriangle,
  Play,
  User,
  Clock,
  Zap,
} from "lucide-react"

interface ManualArrivalVerificationProps {
  onVerify: (identifier: string, type: "booking_id" | "vehicle_number" | "ticket_id") => Promise<BookingDetails | null>
  onConfirmArrival: (bookingId: string) => Promise<void>
  onStartCharging: (bookingId: string) => Promise<void>
}

interface BookingDetails {
  id: string
  ticket_id: string
  vehicle_number: string
  user_name?: string
  charger_type: string
  start_time: string
  end_time: string
  amount: number
  booking_type: "standard" | "emergency" | "walk_in"
  arrival_confirmed: boolean
  charging_started: boolean
}

export const ManualArrivalVerification = ({
  onVerify,
  onConfirmArrival,
  onStartCharging,
}: ManualArrivalVerificationProps) => {
  const [searchInput, setSearchInput] = useState("")
  const [searchType, setSearchType] = useState<"booking_id" | "vehicle_number" | "ticket_id">("vehicle_number")
  const [isSearching, setIsSearching] = useState(false)
  const [foundBooking, setFoundBooking] = useState<BookingDetails | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchInput.trim()) return

    setIsSearching(true)
    setFoundBooking(null)
    setNotFound(false)
    setSuccessMessage(null)

    try {
      const result = await onVerify(searchInput.trim().toUpperCase(), searchType)
      if (result) {
        setFoundBooking(result)
      } else {
        setNotFound(true)
      }
    } catch (error) {
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleConfirmArrival = async () => {
    if (!foundBooking) return
    setIsConfirming(true)
    try {
      await onConfirmArrival(foundBooking.id)
      setFoundBooking({ ...foundBooking, arrival_confirmed: true })
      setSuccessMessage("Arrival confirmed successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Failed to confirm arrival:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleStartCharging = async () => {
    if (!foundBooking) return
    setIsStarting(true)
    try {
      await onStartCharging(foundBooking.id)
      setFoundBooking({ ...foundBooking, charging_started: true })
      setSuccessMessage("Charging session started!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Failed to start charging:", error)
    } finally {
      setIsStarting(false)
    }
  }

  const resetSearch = () => {
    setSearchInput("")
    setFoundBooking(null)
    setNotFound(false)
    setSuccessMessage(null)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const bookingTypeColors = {
    standard: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    emergency: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    walk_in: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0a1016] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Manual Arrival Verification</h3>
            <p className="text-xs text-white/50">For offline or walk-in customers</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-300">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Type Selector */}
        <div className="flex gap-2">
          {[
            { id: "vehicle_number", label: "Vehicle", icon: Car },
            { id: "ticket_id", label: "Ticket ID", icon: QrCode },
            { id: "booking_id", label: "Booking ID", icon: Search },
          ].map((type) => (
            <button
              key={type.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => setSearchType(type.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition ${
                searchType === type.id
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              <type.icon className="w-3.5 h-3.5" />
              {type.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder={
                searchType === "vehicle_number"
                  ? "Enter vehicle number..."
                  : searchType === "ticket_id"
                  ? "Enter ticket ID..."
                  : "Enter booking ID..."
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchInput.trim() || isSearching}
            className={`px-5 rounded-xl flex items-center justify-center transition ${
              searchInput.trim() && !isSearching
                ? "bg-purple-500 text-white hover:bg-purple-400"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Not Found Message */}
        {notFound && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-300">No booking found. Please check the details and try again.</span>
          </div>
        )}

        {/* Found Booking */}
        <AnimatePresence>
          {foundBooking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-4"
            >
              {/* Booking Info Card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/50">Ticket</p>
                    <p className="font-mono text-emerald-300">{foundBooking.ticket_id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full border text-xs ${bookingTypeColors[foundBooking.booking_type]}`}>
                    {foundBooking.booking_type.replace("_", "-")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-white/40" />
                    <span className="text-white">{foundBooking.vehicle_number}</span>
                  </div>
                  {foundBooking.user_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-white/40" />
                      <span className="text-white">{foundBooking.user_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span className="text-white/70">
                      {formatTime(foundBooking.start_time)} - {formatTime(foundBooking.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-white/40" />
                    <span className="text-white/70">{foundBooking.charger_type}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-white/50 text-sm">Amount</span>
                  <span className="text-lg font-semibold text-emerald-300">₹{foundBooking.amount}</span>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="grid grid-cols-2 gap-3">
                {/* Arrival Status */}
                <div className={`p-3 rounded-xl border ${
                  foundBooking.arrival_confirmed 
                    ? "bg-emerald-500/20 border-emerald-500/30" 
                    : "bg-white/5 border-white/10"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className={`w-4 h-4 ${foundBooking.arrival_confirmed ? "text-emerald-400" : "text-white/30"}`} />
                    <span className="text-xs text-white/60">Arrival</span>
                  </div>
                  {foundBooking.arrival_confirmed ? (
                    <p className="text-sm font-medium text-emerald-300">Confirmed</p>
                  ) : (
                    <button
                      onClick={handleConfirmArrival}
                      disabled={isConfirming}
                      className="w-full py-2 rounded-lg bg-emerald-500 text-black text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition"
                    >
                      {isConfirming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Charging Status */}
                <div className={`p-3 rounded-xl border ${
                  foundBooking.charging_started 
                    ? "bg-cyan-500/20 border-cyan-500/30" 
                    : "bg-white/5 border-white/10"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={`w-4 h-4 ${foundBooking.charging_started ? "text-cyan-400" : "text-white/30"}`} />
                    <span className="text-xs text-white/60">Charging</span>
                  </div>
                  {foundBooking.charging_started ? (
                    <p className="text-sm font-medium text-cyan-300">In Progress</p>
                  ) : foundBooking.arrival_confirmed ? (
                    <button
                      onClick={handleStartCharging}
                      disabled={isStarting}
                      className="w-full py-2 rounded-lg bg-cyan-500 text-black text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-cyan-400 transition"
                    >
                      {isStarting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Start
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="text-xs text-white/30">Confirm arrival first</p>
                  )}
                </div>
              </div>

              {/* New Search Button */}
              <button
                onClick={resetSearch}
                className="w-full py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition"
              >
                Search Another Booking
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ManualArrivalVerification
