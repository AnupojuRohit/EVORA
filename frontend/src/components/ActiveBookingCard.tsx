import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import QRCode from "react-qr-code"
import { motion, AnimatePresence } from "framer-motion"
import {
  Timer,
  MapPin,
  Calendar,
  Zap,
  AlertTriangle,
  ChevronRight,
  Navigation,
  ExternalLink,
  X,
  XCircle,
} from "lucide-react"
import { useArrivalCountdown } from "@/hooks/useArrivalCountdown"
import { BookingTypeBadge, BookingType } from "./BookingTypeBadge"

export interface ActiveBookingProps {
  booking: {
    id: string
    station_name?: string
    station?: { name?: string; latitude?: number; longitude?: number }
    charger_type?: string
    start_time?: string
    end_time?: string
    created_at?: string
    ticket_id?: string
    order_id?: string
    amount?: number
    latitude?: number
    longitude?: number
    status?: string
    arrival_confirmed?: boolean
    booking_type?: BookingType
  }
  onViewTicket?: () => void
  onCancel?: (bookingId: string) => void
}

const ActiveBookingCard = ({ booking, onViewTicket, onCancel }: ActiveBookingProps) => {
  const navigate = useNavigate()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelled, setIsCancelled] = useState(booking.status?.toLowerCase() === 'cancelled')
  const bookingType: BookingType = booking.booking_type || 'standard'

  // Use the reusable countdown hook - calculates based on booking created_at + 20 min arrival window
  const {
    remainingTimeFormatted,
    remainingMs,
    isExpired,
    isBeforeSlotStart,
    timeUntilSlotStartFormatted,
    isWarning,
  } = useArrivalCountdown(booking.created_at, 20, booking.start_time)

  // Can cancel only before slot starts
  const slotStartTime = booking.start_time ? new Date(booking.start_time).getTime() : null
  const canCancel = slotStartTime ? Date.now() < slotStartTime && booking.status !== 'cancelled' : false

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const stationName = booking.station_name || booking.station?.name || "Station"
  const ticketId = booking.ticket_id || booking.order_id || booking.id
  const qrValue = JSON.stringify({
    ticketId,
    bookingId: booking.id,
    stationName,
    chargerType: booking.charger_type || "Standard",
    startTime: booking.start_time,
    endTime: booking.end_time,
    amount: booking.amount,
    date: formatDate(booking.start_time),
    timeSlot: `${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`,
    bookingType: bookingType,
  })

  // Get coordinates for navigation
  const lat = booking.station?.latitude || booking.latitude
  const lng = booking.station?.longitude || booking.longitude
  const mapsUrl = lat && lng ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : null

  const handleViewTicket = () => {
    if (onViewTicket) {
      onViewTicket()
    } else {
      navigate(`/booking/ticket/${booking.id}`, {
        state: {
          ticketId: booking.ticket_id || booking.order_id || booking.id,
          slot: {
            id: booking.id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            charger_type: booking.charger_type,
            total_price: booking.amount,
          },
          station: {
            name: stationName,
            latitude: lat,
            longitude: lng,
          },
          qrPayload: ticketId,
        },
      })
    }
  }

  const handleNavigate = () => {
    if (mapsUrl) {
      window.open(mapsUrl, "_blank")
    }
  }

  const handleCancel = (bookingId: string) => {
    setIsCancelled(true)
    onCancel?.(bookingId)
  }

  // Skip rendering cancelled bookings (or show cancelled state)
  if (isCancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-gray-500/30 bg-gradient-to-br from-gray-500/10 to-gray-500/5 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-gray-400" />
            <div>
              <p className="text-white font-medium">{stationName}</p>
              <p className="text-xs text-gray-400">Booking Cancelled</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs">
            Cancelled
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border ${
        bookingType === 'emergency' || bookingType === 'emergency_requested'
          ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5'
          : bookingType === 'walk_in'
          ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5'
          : 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5'
      } p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.9)]`}
    >
      {/* Background glow */}
      <div className={`absolute inset-0 ${
        bookingType === 'emergency' || bookingType === 'emergency_requested'
          ? 'bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.15),_transparent_55%)]'
          : 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_55%)]'
      }`} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Timer className={`w-5 h-5 ${
                bookingType === 'emergency' ? 'text-amber-400' : 'text-emerald-400'
              }`} />
              <p className={`text-xs uppercase tracking-[0.3em] ${
                bookingType === 'emergency' ? 'text-amber-300' : 'text-emerald-300'
              }`}>
                {isExpired ? "Arrival window expired" : "Active Booking"}
              </p>
              <BookingTypeBadge type={bookingType} size="sm" />
            </div>
            <h3 className="text-xl font-semibold text-white mt-2">
              {stationName}
            </h3>
          </div>

          {/* Countdown Timer */}
          <div className="text-right">
            <p className="text-xs text-white/50">
              {isExpired ? "Status" : "Arrive within"}
            </p>
            {isExpired ? (
              <p className="text-2xl font-bold text-red-400">Expired</p>
            ) : (
              <p className={`text-2xl font-bold ${
                isWarning ? "text-amber-400" : bookingType === 'emergency' ? "text-amber-300" : "text-emerald-300"
              }`}>
                {remainingTimeFormatted}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          {/* Booking Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </div>
                <p className="font-semibold text-white mt-1">{formatDate(booking.start_time)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Timer className="w-3.5 h-3.5" /> Time slot
                </div>
                <p className="font-semibold text-white mt-1 text-sm">
                  {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Zap className="w-3.5 h-3.5" /> Charger
                </div>
                <p className="font-semibold text-white mt-1">{booking.charger_type || "Standard"}</p>
              </div>
            </div>

            {/* Warning for expiring soon */}
            {!isExpired && isWarning && !isBeforeSlotStart && (
              <div className="flex gap-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-400/20 p-3 rounded-2xl">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <p>Less than 5 minutes to arrive! Head to the station now.</p>
              </div>
            )}

            {isExpired && (
              <div className="flex gap-2 text-xs text-red-200 bg-red-500/10 border border-red-400/20 p-3 rounded-2xl">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <p>Arrival window has expired. Penalty charges may apply.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleViewTicket}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 border border-emerald-400/30 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(52,211,153,0.8)] hover:bg-emerald-400 transition"
              >
                <ExternalLink className="w-4 h-4" /> View Ticket
              </button>
              {mapsUrl && (
                <button
                  onClick={handleNavigate}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-300 hover:bg-cyan-500/20 transition"
                >
                  <Navigation className="w-4 h-4" /> Navigate to Station
                </button>
              )}
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/20 transition"
              >
                <XCircle className="w-4 h-4" /> Cancel Booking
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="rounded-xl bg-white p-3">
                <QRCode value={qrValue} size={120} />
              </div>
              <p className="text-xs text-white/50 text-center mt-2">Scan at station</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>

    {/* Cancel Confirmation Modal */}
    <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowCancelModal(false)}
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
                  <h2 className="text-lg font-semibold text-white">Cancel Booking</h2>
                  <p className="text-sm text-white/50 mt-1">This action cannot be undone</p>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-full p-2 hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm text-red-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Are you sure you want to cancel this booking?
                  </p>
                  <p className="text-xs text-red-300/70 mt-2">
                    Refunds will be processed according to our cancellation policy.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 rounded-full border border-white/10 py-3 text-white hover:bg-white/5 transition"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="flex-1 rounded-full bg-red-500 py-3 font-semibold text-white hover:bg-red-400 transition"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ActiveBookingCard
