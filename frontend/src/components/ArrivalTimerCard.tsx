import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Timer,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Calendar,
  Zap,
  X,
} from "lucide-react"
import { useArrivalCountdown } from "@/hooks/useArrivalCountdown"

/* ----------------------------
   Types
----------------------------- */
export type ArrivalState = "BEFORE_SLOT" | "EXTENSION_REQUESTED" | "ARRIVED" | "MISSED"

export interface Booking {
  id: string
  station_name?: string
  station?: { name?: string }
  charger_type?: string
  start_time?: string
  end_time?: string
  created_at?: string
  ticket_id?: string
  order_id?: string
  amount?: number
}

interface ArrivalTimerCardProps {
  booking: Booking
  onArrivalConfirm: (bookingId: string) => void
  onExtensionRequest: (bookingId: string, extraMinutes: number) => void
  onMissed: (bookingId: string) => void
  hasPenalty?: boolean
}

/* ----------------------------
   Extension Request Modal
----------------------------- */
const ExtensionModal = ({
  isOpen,
  onClose,
  onRequest,
  bookingId,
}: {
  isOpen: boolean
  onClose: () => void
  onRequest: (bookingId: string, minutes: number) => void
  bookingId: string
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
  const extensionOptions = [10, 15, 20, 30]

  const handleRequest = () => {
    if (selectedMinutes) {
      onRequest(bookingId, selectedMinutes)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0a1016] p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Request Extension</h2>
              <p className="text-sm text-white/50 mt-1">Need more time to arrive?</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-white/10 transition"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-white/60">Select additional time needed:</p>
            <div className="grid grid-cols-2 gap-3">
              {extensionOptions.map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSelectedMinutes(mins)}
                  className={`rounded-xl border p-4 text-center transition ${
                    selectedMinutes === mins
                      ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-lg font-semibold">+{mins}</span>
                  <span className="text-xs text-white/50 block">minutes</span>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Extension requests are subject to slot availability
              </p>
            </div>

            <button
              onClick={handleRequest}
              disabled={!selectedMinutes}
              className={`w-full rounded-full py-3 font-semibold transition ${
                selectedMinutes
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
              }`}
            >
              Request Extension
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ----------------------------
   Arrival Timer Card
----------------------------- */
const ArrivalTimerCard = ({
  booking,
  onArrivalConfirm,
  onExtensionRequest,
  onMissed,
  hasPenalty = false,
}: ArrivalTimerCardProps) => {
  const navigate = useNavigate()
  const [arrivalState, setArrivalState] = useState<ArrivalState>("BEFORE_SLOT")
  const [showExtensionModal, setShowExtensionModal] = useState(false)
  const [extensionMinutes, setExtensionMinutes] = useState(0)

  // Use the reusable countdown hook with dynamic extension time
  const {
    remainingTimeFormatted,
    remainingMs,
    isExpired,
    isBeforeSlotStart,
    timeUntilSlotStartFormatted,
    isWarning,
  } = useArrivalCountdown(booking.created_at, 20 + extensionMinutes, booking.start_time)

  // Auto-transition to MISSED state when timer expires (only after slot has started)
  useEffect(() => {
    // Don't transition to MISSED if we're still before the slot start time
    if (!isBeforeSlotStart && isExpired && arrivalState === "BEFORE_SLOT") {
      setArrivalState("MISSED")
      onMissed(booking.id)
    }
  }, [isExpired, arrivalState, booking.id, onMissed, isBeforeSlotStart])

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleConfirmArrival = () => {
    setArrivalState("ARRIVED")
    onArrivalConfirm(booking.id)
  }

  const handleExtensionRequest = (bookingId: string, minutes: number) => {
    setArrivalState("EXTENSION_REQUESTED")
    setExtensionMinutes(minutes)
    // After a mock delay, reset to BEFORE_SLOT with extended time
    setTimeout(() => {
      setArrivalState("BEFORE_SLOT")
    }, 2000)
    onExtensionRequest(bookingId, minutes)
  }

  const stationName = booking.station_name || booking.station?.name || "Station"
  const ticketId = booking.ticket_id || booking.order_id || booking.id

  // State-based styling
  const stateConfig = {
    BEFORE_SLOT: {
      borderColor: "border-emerald-500/30",
      bgGradient: "from-emerald-500/10 to-cyan-500/5",
      icon: Timer,
      iconColor: "text-emerald-400",
      statusText: "Arrive within",
      statusColor: "text-emerald-300",
    },
    EXTENSION_REQUESTED: {
      borderColor: "border-amber-500/30",
      bgGradient: "from-amber-500/10 to-orange-500/5",
      icon: Clock,
      iconColor: "text-amber-400",
      statusText: "Extension pending",
      statusColor: "text-amber-300",
    },
    ARRIVED: {
      borderColor: "border-emerald-500/30",
      bgGradient: "from-emerald-500/15 to-cyan-500/10",
      icon: CheckCircle,
      iconColor: "text-emerald-400",
      statusText: "Arrived",
      statusColor: "text-emerald-300",
    },
    MISSED: {
      borderColor: "border-red-500/30",
      bgGradient: "from-red-500/10 to-orange-500/5",
      icon: XCircle,
      iconColor: "text-red-400",
      statusText: "Slot missed",
      statusColor: "text-red-300",
    },
  }

  const config = stateConfig[arrivalState]
  const StateIcon = config.icon

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl border ${config.borderColor} bg-gradient-to-br ${config.bgGradient} p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.9)]`}
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_55%)]" />

        <div className="relative space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <StateIcon className={`w-5 h-5 ${config.iconColor}`} />
                <p className={`text-xs uppercase tracking-[0.3em] ${config.statusColor}`}>
                  {config.statusText}
                </p>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">
                {arrivalState === "ARRIVED" ? (
                  "You've arrived!"
                ) : arrivalState === "MISSED" ? (
                  "Booking missed"
                ) : arrivalState === "EXTENSION_REQUESTED" ? (
                  "Processing..."
                ) : (
                  remainingTimeFormatted
                )}
              </h3>
              {arrivalState === "BEFORE_SLOT" && isWarning && (
                <p className="text-xs text-amber-300 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Less than 5 minutes remaining
                </p>
              )}
            </div>

            {/* Progress ring for BEFORE_SLOT state */}
            {arrivalState === "BEFORE_SLOT" && remainingMs > 0 && (
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#34d399"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={
                      2 * Math.PI * 28 * (1 - Math.min(1, remainingMs / ((20 + extensionMinutes) * 60 * 1000)))
                    }
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <MapPin className="w-3.5 h-3.5" /> Station
              </div>
              <p className="font-semibold text-white mt-1">{stationName}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Calendar className="w-3.5 h-3.5" /> Slot window
              </div>
              <p className="font-semibold text-white mt-1">
                {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Zap className="w-3.5 h-3.5" /> Ticket ID
              </div>
              <p className="font-semibold text-white mt-1 text-sm break-all">{ticketId}</p>
            </div>
          </div>

          {/* Penalty Warning */}
          {hasPenalty && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-200">Penalty Notice</p>
                  <p className="text-xs text-red-300/70 mt-1">
                    You have a previous missed slot. Penalties may apply on this booking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* State-specific content */}
          {arrivalState === "MISSED" && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-200">Booking Missed</p>
                  <p className="text-xs text-red-300/70 mt-1">
                    You didn't arrive within the allowed time. A penalty flag has been added to your account.
                    This may affect your next booking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {arrivalState === "EXTENSION_REQUESTED" && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                <p className="text-sm text-amber-200">
                  Checking slot availability for your extension request...
                </p>
              </div>
            </div>
          )}

          {arrivalState === "ARRIVED" && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-200">Ready to charge!</p>
                  <p className="text-xs text-emerald-300/70 mt-1">
                    Scan the QR code at the station to begin your charging session.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {arrivalState === "BEFORE_SLOT" && (
              <>
                <button
                  onClick={handleConfirmArrival}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_12px_30px_-20px_rgba(52,211,153,0.8)] hover:bg-emerald-400 transition"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm Arrival
                </button>
                <button
                  onClick={() => setShowExtensionModal(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
                >
                  <Clock className="w-4 h-4" /> Request Extension
                </button>
              </>
            )}

            {arrivalState === "ARRIVED" && (
              <button
                onClick={() => navigate(`/booking/ticket/${booking.id}`)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_12px_30px_-20px_rgba(52,211,153,0.8)] hover:bg-emerald-400 transition"
              >
                <Zap className="w-4 h-4" /> Start Charging
              </button>
            )}

            {arrivalState === "MISSED" && (
              <button
                onClick={() => navigate("/dashboard/bookings")}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
              >
                Book Another Slot <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => navigate(`/booking/ticket/${booking.id}`)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition"
            >
              View Ticket Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Extension Modal */}
      <ExtensionModal
        isOpen={showExtensionModal}
        onClose={() => setShowExtensionModal(false)}
        onRequest={handleExtensionRequest}
        bookingId={booking.id}
      />
    </>
  )
}

export default ArrivalTimerCard
export { ExtensionModal }
