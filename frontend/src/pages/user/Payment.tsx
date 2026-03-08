import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CheckCircle, ArrowLeft, Upload } from "lucide-react"
import QRCode from "react-qr-code"
import { v4 as uuidv4 } from "uuid"
import { bookingAPI } from "@/lib/api"


/* ----------------------------
   Types
----------------------------- */
interface PaymentSlot {
  id: string            
  start_time: string
  end_time: string
  charger_type: string
  price_per_hour: number
  duration_hours: number
  total_price: number
}

/* ----------------------------
   Page
----------------------------- */
const PaymentPage = () => {
  
  const location = useLocation()
const navigate = useNavigate()

const state = location.state as {
  stationId: string
  carId: string
  station: {
    latitude: number
    longitude: number
    name?: string
  }
  slot: PaymentSlot
} | null

  const data = (state || {}) as any
  const slot = data.slot as PaymentSlot | undefined

  /* ----------------------------
     Payment State
  ----------------------------- */
  const [orderId] = useState(uuidv4())
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview)
      }
    }
  }, [proofPreview])

  /* ----------------------------
     Mock UPI Payload
  ----------------------------- */
  const upiPayload = `
upi://pay
?pa=laxev@upi
&pn=Lax%20EV%20Stations
&am=${slot?.total_price?.toFixed(2) ?? "0.00"}
&cu=INR
&tn=Order%20${orderId}
  `.replace(/\s/g, "")

  /* ----------------------------
     Handlers
  ----------------------------- */
  const handleConfirmPayment = async () => {
    if (!state?.slot || !state?.stationId || !state?.carId) {
      navigate("/dashboard")
      return
    }
    
    setBookingError(null)
    setIsSubmitting(true)
    
    try {
      const txnId = "TXN-" + uuidv4().slice(0, 12).toUpperCase()
      setTransactionId(txnId)

      const res = await bookingAPI.createBooking({
        station_id: state.stationId,
        slot_id: slot.id,
        car_id: state.carId,
        order_id: orderId,
        transaction_id: txnId,
        amount: slot.total_price,
      })

      const qrPayload = JSON.stringify({ ticketId: res.data.ticket_id, carId: state.carId })

      navigate(`/booking/ticket/${res.data.booking_id}`, {
        state: {
          ticketId: res.data.ticket_id,
          slot,
          station: data.station,
          transactionId: txnId,
          amount: slot.total_price,
          qrPayload,
        },
      })
    } catch (err: any) {
      console.error(err)
      const errorMsg = err?.response?.data?.detail || "Payment failed"
      if (errorMsg.includes("not available")) {
        setBookingError("This slot is no longer available. Please select another slot.")
      } else if (errorMsg.includes("already exists")) {
        setBookingError("This booking has already been processed.")
      } else {
        setBookingError(errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpload = (file: File | null) => {
    if (!file) return
    setUploadProgress(0)
    setUploadComplete(false)
    const url = URL.createObjectURL(file)
    setProofPreview(url)

    let progress = 0
    const interval = setInterval(() => {
      progress += 20
      setUploadProgress(Math.min(progress, 100))
      if (progress >= 100) {
        clearInterval(interval)
        setUploadComplete(true)
      }
    }, 200)
  }

  const handlePayAtStation = async () => {
    if (!state?.slot || !state?.stationId || !state?.carId) {
      navigate("/dashboard")
      return
    }
    
    setBookingError(null)
    setIsSubmitting(true)
    
    try {
      const txnId = "PAY-AT-STATION-" + uuidv4().slice(0, 8).toUpperCase()
      setTransactionId(txnId)

      const res = await bookingAPI.createBooking({
        station_id: state.stationId,
        slot_id: slot!.id,
        car_id: state.carId,
        order_id: orderId,
        transaction_id: txnId,
        amount: slot!.total_price,
      })

      const qrPayload = JSON.stringify({ ticketId: res.data.ticket_id, carId: state.carId })

      navigate(`/booking/ticket/${res.data.booking_id}`, {
        state: {
          ticketId: res.data.ticket_id,
          slot,
          station: data.station,
          transactionId: txnId,
          amount: slot!.total_price,
          qrPayload,
          payAtStation: true,
        },
      })
    } catch (err: any) {
      console.error(err)
      const errorMsg = err?.response?.data?.detail || "Booking failed"
      if (errorMsg.includes("not available")) {
        setBookingError("This slot is no longer available. Please select another slot.")
      } else if (errorMsg.includes("already exists")) {
        setBookingError("This booking has already been processed.")
      } else {
        setBookingError(errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ----------------------------
     Render
  ----------------------------- */
  if (!state?.slot || !state?.stationId || !state?.carId || !slot) {
    return (
      <div className="min-h-screen bg-[#070b10] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Checkout</p>
          <h1 className="text-xl font-semibold">Payment session not found</h1>
          <p className="text-sm text-slate-400">
            Your booking details are missing. Please start the booking flow again.
          </p>
          <button
            onClick={() => navigate("/dashboard/bookings")}
            className="w-full rounded-full border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/5"
          >
            Go to Bookings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(34,211,238,0.12),_transparent_50%)]" />

        {/* Header */}
        <div className="relative border-b border-white/10 bg-[#0a1016]/80 backdrop-blur-2xl">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 rounded-full p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Checkout</p>
              <h1 className="text-lg font-semibold">Secure Payment</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Order Summary */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Order Summary</h2>
              <span className="text-xs text-slate-400">Order ID: {orderId}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-slate-400">Charger</p>
                <p className="font-semibold">{slot.charger_type}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-slate-400">Time window</p>
                <p className="font-semibold">
                  {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" – "}
                  {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-slate-400">Duration</p>
                <p className="font-semibold">{slot.duration_hours} hour(s)</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-slate-400">Rate</p>
                <p className="font-semibold">₹{slot.price_per_hour}/hr</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-emerald-300">₹{slot.total_price.toFixed(2)}</span>
            </div>
          </div>

          {/* UPI Payment */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-5 text-center">
            <div>
              <h2 className="font-semibold">Pay using UPI</h2>
              <p className="text-xs text-slate-400 mt-2">Scan with any UPI app (GPay, PhonePe, Paytm)</p>
            </div>

            <div className="flex justify-center">
              <div className="rounded-2xl bg-white p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.7)]">
                <QRCode value={upiPayload} size={180} />
              </div>
            </div>

            <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-left space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload payment screenshot after completing UPI payment</span>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:px-3 file:py-2 file:text-emerald-200 file:font-semibold"
              />

              {proofPreview && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <img src={proofPreview} alt="Payment proof" className="max-h-40 w-full object-contain" />
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {uploadComplete && (
                    <p className="mt-2 text-xs text-emerald-300 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Screenshot uploaded successfully
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-slate-400">
              <span>Payment → Confirmation → Ticket</span>
              <span className={uploadComplete ? "text-emerald-300" : "text-slate-400"}>
                {uploadComplete ? "Ready to proceed" : "Awaiting screenshot upload"}
              </span>
            </div>

            <p className="text-xs text-amber-300">
              Charging starts only after payment confirmation.
            </p>

            {bookingError && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
                {bookingError}
                <button
                  onClick={() => navigate(-1)}
                  className="mt-2 text-xs underline hover:no-underline"
                >
                  Go back and select another slot
                </button>
              </div>
            )}

            {!paymentSuccess ? (
              <button
                onClick={handleConfirmPayment}
                disabled={!uploadComplete || isSubmitting}
                className={`mt-2 px-6 py-3 rounded-full font-semibold transition shadow-[0_20px_50px_-30px_rgba(16,185,129,0.7)] ${
                  !uploadComplete || isSubmitting
                    ? "bg-white/10 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                }`}
              >
                {isSubmitting ? "Processing..." : "Continue to Ticket"}
              </button>
            ) : (
              <div className="mt-2 flex flex-col items-center gap-2 text-emerald-300">
                <CheckCircle className="w-6 h-6" />
                <p className="font-medium">Payment Confirmed</p>
                <p className="text-xs text-slate-400">Transaction ID: {transactionId}</p>
              </div>
            )}
          </div>

          {/* Pay at Station Option */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20">
                <span className="text-amber-400 text-lg">₹</span>
              </div>
              <div>
                <h2 className="font-semibold">Pay at Station</h2>
                <p className="text-xs text-slate-400">Reserve now, pay when you arrive</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300 space-y-2">
              <p>• Your slot will be reserved for 20 minutes</p>
              <p>• Pay via UPI, card, or cash at the Stations</p>
              <p>• Show your ticket QR code to the station attendant</p>
            </div>

            <button
              onClick={handlePayAtStation}
              disabled={isSubmitting}
              className={`w-full px-6 py-3 rounded-full font-semibold border transition ${
                isSubmitting
                  ? "bg-white/10 text-slate-500 cursor-not-allowed border-white/10"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30"
              }`}
            >
              {isSubmitting ? "Processing..." : "Reserve & Pay at Station"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
