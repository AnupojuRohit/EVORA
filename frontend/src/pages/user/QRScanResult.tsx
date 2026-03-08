import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Timer,
  Zap,
  CreditCard,
  Ticket,
  ArrowLeft,
  AlertTriangle,
  Navigation,
  Sparkles,
} from "lucide-react"

interface ScannedBookingData {
  ticketId: string
  bookingId: string
  stationName: string
  chargerType?: string
  startTime?: string
  endTime?: string
  amount?: number
  date?: string
  timeSlot?: string
  bookingType?: string
}

const QRScanResult = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [bookingData, setBookingData] = useState<ScannedBookingData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    // Try to get data from URL params or from the 'data' query param
    const dataParam = searchParams.get("data")
    
    if (dataParam) {
      try {
        const decoded = decodeURIComponent(dataParam)
        const parsed = JSON.parse(decoded)
        setBookingData(parsed)
        
        // Simulate verification delay
        setTimeout(() => setIsVerified(true), 1500)
      } catch (e) {
        setError("Invalid QR code data. Please scan again.")
      }
    } else {
      // Check if we have individual params
      const ticketId = searchParams.get("ticketId")
      const bookingId = searchParams.get("bookingId")
      const stationName = searchParams.get("stationName")
      
      if (ticketId && bookingId) {
        setBookingData({
          ticketId,
          bookingId,
          stationName: stationName || "Unknown Station",
          chargerType: searchParams.get("chargerType") || undefined,
          startTime: searchParams.get("startTime") || undefined,
          endTime: searchParams.get("endTime") || undefined,
          amount: searchParams.get("amount") ? parseFloat(searchParams.get("amount")!) : undefined,
          date: searchParams.get("date") || undefined,
          timeSlot: searchParams.get("timeSlot") || undefined,
          bookingType: searchParams.get("bookingType") || undefined,
        })
        setTimeout(() => setIsVerified(true), 1500)
      } else {
        setError("No booking data found. Please scan a valid QR code.")
      }
    }
  }, [searchParams])

  const formatCurrency = (amount?: number) => {
    if (!amount) return "—"
    return `₹${amount.toFixed(2)}`
  }

  const getBookingTypeLabel = (type?: string) => {
    switch (type) {
      case "emergency":
      case "emergency_requested":
        return { label: "Emergency", color: "text-amber-400", bg: "bg-amber-500/20" }
      case "walk_in":
        return { label: "Walk-In", color: "text-cyan-400", bg: "bg-cyan-500/20" }
      default:
        return { label: "Standard", color: "text-emerald-400", bg: "bg-emerald-500/20" }
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a1016] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5 p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Scan Error</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-6 py-3 text-white hover:bg-white/20 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-[#0a1016] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const bookingTypeInfo = getBookingTypeLabel(bookingData.bookingType)

  return (
    <div className="min-h-screen bg-[#0a1016] p-4 sm:p-8">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.1),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.05),_transparent_50%)]" />
      </div>

      <div className="relative max-w-lg mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 overflow-hidden"
        >
          {/* Verification Header */}
          <div className="relative p-6 border-b border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.2),_transparent_70%)]" />
            
            <div className="relative flex items-center justify-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: isVerified ? 1 : 0.8 }}
                transition={{ type: "spring", damping: 10 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isVerified ? "bg-emerald-500/20" : "bg-white/10"
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                )}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-4"
            >
              <h1 className="text-2xl font-bold text-white">
                {isVerified ? "Booking Verified" : "Verifying..."}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {isVerified ? "Your charging slot is ready" : "Please wait while we verify your booking"}
              </p>
            </motion.div>
          </div>

          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isVerified ? 1 : 0.5 }}
            transition={{ delay: 0.5 }}
            className="p-6 space-y-4"
          >
            {/* Station Name */}
            <div className="text-center pb-4 border-b border-white/10">
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="text-xs uppercase tracking-[0.2em]">Station</span>
              </div>
              <h2 className="text-xl font-semibold text-white">{bookingData.stationName}</h2>
              
              {/* Booking Type Badge */}
              <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium ${bookingTypeInfo.bg} ${bookingTypeInfo.color}`}>
                <Sparkles className="w-3 h-3" />
                {bookingTypeInfo.label} Booking
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                  <Ticket className="w-3.5 h-3.5" /> Ticket ID
                </div>
                <p className="font-mono text-sm text-white truncate">{bookingData.ticketId}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                  <Zap className="w-3.5 h-3.5" /> Charger
                </div>
                <p className="font-semibold text-white">{bookingData.chargerType || "Standard"}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </div>
                <p className="font-semibold text-white">{bookingData.date || "—"}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                  <Timer className="w-3.5 h-3.5" /> Time Slot
                </div>
                <p className="font-semibold text-white text-sm">{bookingData.timeSlot || "—"}</p>
              </div>
            </div>

            {/* Amount */}
            {bookingData.amount && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Amount Paid</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-400">
                    {formatCurrency(bookingData.amount)}
                  </span>
                </div>
              </div>
            )}

            {/* Instructions */}
            {isVerified && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4"
              >
                <h3 className="text-sm font-semibold text-cyan-300 mb-2">Next Steps</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Proceed to the designated charger bay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>Connect your vehicle to the {bookingData.chargerType || "charger"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>Charging will start automatically</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </motion.div>

          {/* Footer Actions */}
          {isVerified && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="p-6 pt-0"
            >
              <button
                onClick={() => navigate("/dashboard/bookings")}
                className="w-full rounded-full bg-emerald-500 py-3.5 font-semibold text-slate-900 hover:bg-emerald-400 transition shadow-[0_12px_30px_-10px_rgba(52,211,153,0.5)]"
              >
                View My Bookings
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Help Text */}
        <p className="text-center text-white/40 text-xs mt-6">
          Need help? Contact station staff or call support
        </p>
      </div>
    </div>
  )
}

export default QRScanResult
