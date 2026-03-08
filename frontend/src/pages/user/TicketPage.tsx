import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import QRCode from "react-qr-code"
import { MapPin, AlertTriangle, ArrowLeft, Clock3, XCircle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useArrivalCountdown } from "@/hooks/useArrivalCountdown"
import { bookingAPI } from "@/lib/api"

interface TicketSlot {
  id: string
  start_time: string
  end_time: string
  charger_type: string
  total_price: number
}

interface TicketStation {
  latitude: number
  longitude: number
  name?: string
}

const TicketPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { bookingId } = useParams()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for ticket data - can be from location.state or fetched
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [slot, setSlot] = useState<TicketSlot | null>(null)
  const [station, setStation] = useState<TicketStation | null>(null)
  const [transactionId, setTransactionId] = useState<string | undefined>()
  const [amount, setAmount] = useState<number | undefined>()
  const [qrPayload, setQrPayload] = useState<string | undefined>()
  const [payAtStation, setPayAtStation] = useState<boolean | undefined>()
  const [bookingCreatedAt, setBookingCreatedAt] = useState<string | null>(null)

  // Initialize from location.state if available
  useEffect(() => {
    const state = location.state as {
      ticketId?: string
      slot?: TicketSlot
      station?: TicketStation
      transactionId?: string
      amount?: number
      qrPayload?: string
      payAtStation?: boolean
      created_at?: string
    } | null

    if (state?.ticketId && state?.slot && state?.station) {
      // Use data from navigation state
      setTicketId(state.ticketId)
      setSlot(state.slot)
      setStation(state.station)
      setTransactionId(state.transactionId)
      setAmount(state.amount)
      setQrPayload(state.qrPayload)
      setPayAtStation(state.payAtStation)
      setBookingCreatedAt(state.created_at || new Date().toISOString())
    } else if (bookingId) {
      // Fetch from API if no state but have bookingId
      setLoading(true)
      setError(null)
      
      bookingAPI.getBookingById(bookingId)
        .then(res => {
          const data = res.data
          setTicketId(data.ticket_id)
          setSlot({
            id: data.slot_id,
            start_time: data.start_time,
            end_time: data.end_time,
            charger_type: data.charger_type || "Standard",
            total_price: data.amount
          })
          setStation(data.station)
          setTransactionId(data.transaction_id)
          setAmount(data.amount)
          setQrPayload(data.ticket_id)
          setPayAtStation(data.status === "PAY_AT_STATION")
          setBookingCreatedAt(data.created_at)
        })
        .catch(err => {
          console.error("Failed to fetch booking:", err)
          setError("Could not load ticket details")
        })
        .finally(() => setLoading(false))
    }
  }, [location.state, bookingId])

  // Capture booking time
  const bookingTime = bookingCreatedAt || new Date().toISOString()

  // Use the reusable countdown hook - calculates based on booking time + 20 min arrival window
  const {
    remainingTimeFormatted,
    remainingMs,
    isExpired,
    isBeforeSlotStart,
    timeUntilSlotStartFormatted,
    isWarning,
  } = useArrivalCountdown(bookingTime, 20, slot?.start_time)
  
  // Cancel booking state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const slotStartTime = slot?.start_time ? new Date(slot.start_time).getTime() : null
  const canCancel = slotStartTime ? Date.now() < slotStartTime && !isCancelled : false

  const handleCancelBooking = () => {
    setIsCancelled(true)
    setShowCancelModal(false)
    // In a real app, call API to cancel booking
    // api.cancelBooking(ticketId).then(() => navigate('/dashboard'))
  }

  // Get the countdown label based on state
  const countdownLabel = useMemo(() => {
    if (isExpired) return "Expired"
    return remainingTimeFormatted
  }, [isExpired, remainingTimeFormatted])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b10] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Loading ticket details...</p>
        </div>
      </div>
    )
  }

  // Error or not found state
  if (error || !ticketId || !slot || !station) {
    return (
      <div className="min-h-screen bg-[#070b10] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ticket</p>
          <h1 className="text-xl font-semibold">{error || "Ticket not found"}</h1>
          <p className="text-sm text-slate-400">
            Your ticket details are not available. Please check your bookings or return to the dashboard.
          </p>
          <button
            onClick={() => navigate("/dashboard/bookings")}
            className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm text-slate-900 font-medium hover:bg-emerald-400 transition"
          >
            View My Bookings
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm text-white font-medium hover:bg-white/10 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const mapsUrl = `https://www.google.com/maps?q=${station.latitude},${station.longitude}`

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(34,211,238,0.12),_transparent_50%)]" />

        <div className="relative max-w-5xl mx-auto px-6 py-10 space-y-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Charging Ticket</p>
                <h1 className="text-2xl font-semibold">Present this QR at the station</h1>
                <p className="text-sm text-slate-400 mt-2">
                  Your charging ticket unlocks your reserved slot once payment is verified.
                </p>
              </div>

              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/40 p-6">
                <div className="rounded-2xl bg-white p-4">
                  <QRCode value={qrPayload || ticketId} size={200} />
                </div>
                <p className="mt-4 text-sm text-slate-400 text-center">
                  Scan to start charging at the kiosk.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-slate-400">Ticket ID</p>
                  <p className="font-semibold break-all">{ticketId}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-slate-400">Station</p>
                  <p className="font-semibold">{station.name || "Assigned Station"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-slate-400">Date</p>
                  <p className="font-semibold">{new Date(slot.start_time).toLocaleDateString()}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-slate-400">Time</p>
                  <p className="font-semibold">
                    {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Arrival Window</p>
                    <h2 className="text-lg font-semibold">
                      {isExpired ? "Window Expired" : "Arrive within 20 minutes"}
                    </h2>
                  </div>
                  <Clock3 className={`w-5 h-5 ${isExpired ? "text-red-400" : "text-emerald-300"}`} />
                </div>
                <div className={`rounded-2xl border p-4 text-center ${
                  isExpired 
                    ? "border-red-500/20 bg-red-500/10" 
                    : "border-white/10 bg-black/40"
                }`}>
                  <p className={`text-3xl font-semibold ${
                    isExpired 
                      ? "text-red-400" 
                      : isWarning 
                        ? "text-amber-400" 
                        : "text-emerald-200"
                  }`}>
                    {countdownLabel}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {isExpired
                      ? "Arrival window elapsed. Penalty may apply."
                      : "Head to the station before timer expires"
                    }
                  </p>
                </div>
                {!isExpired && isWarning && (
                  <div className="flex gap-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-400/20 p-3 rounded-2xl">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <p>
                      Less than 5 minutes remaining! Head to the station now.
                    </p>
                  </div>
                )}
                {isExpired && (
                  <div className="flex gap-2 text-xs text-red-200 bg-red-500/10 border border-red-400/20 p-3 rounded-2xl">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <p>
                      Arrival window has expired. Penalty charges may apply.
                    </p>
                  </div>
                )}

              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment</p>
                
                {payAtStation && (
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                        Pay at Station
                      </span>
                    </div>
                    <p className="text-sm text-amber-200">
                      Please pay ₹{amount?.toFixed(2) || slot.total_price.toFixed(2)} at the station or to the attendant.
                    </p>
                  </div>
                )}
                
                <div className="text-sm space-y-2">
                  {transactionId && (
                    <p>
                      <span className="text-slate-400">Transaction ID:</span> {transactionId}
                    </p>
                  )}
                  {typeof amount === "number" && (
                    <p>
                      <span className="text-slate-400">{payAtStation ? "Amount Due:" : "Amount Paid:"}</span> ₹{amount.toFixed(2)}
                    </p>
                  )}
                  <p>
                    <span className="text-slate-400">Charger:</span> {slot.charger_type}
                  </p>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
                >
                  <MapPin className="w-4 h-4" /> Navigate to Station
                </a>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 rounded-full border border-white/20 bg-white/5 text-sm text-white font-medium hover:bg-white/10 transition"
                >
                  View My Bookings
                </button>
                
                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-3 rounded-full border border-red-500/30 bg-red-500/10 text-sm text-red-300 font-medium hover:bg-red-500/20 transition"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" /> Cancel Booking
                    </span>
                  </button>
                )}
                
                {isCancelled && (
                  <div className="w-full py-3 px-4 rounded-full bg-gray-500/20 border border-gray-500/30 text-center">
                    <span className="text-gray-400 text-sm">Booking Cancelled</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
                    onClick={handleCancelBooking}
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
    </div>
  )
}

export default TicketPage
