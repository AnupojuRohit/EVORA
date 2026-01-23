import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CheckCircle, ArrowLeft } from "lucide-react"
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

const data = state || {} as any
const slot = data.slot

  useEffect(() => {
  if (!state?.slot || !state?.stationId || !state?.carId) {
    navigate("/dashboard")
  }
}, [state, navigate])

  /* ----------------------------
     Payment State
  ----------------------------- */
  const [orderId] = useState(uuidv4())
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

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
  } catch (err) {
    console.error(err)
    alert("Payment failed. Please try again.")
  }
}

  /* ----------------------------
     Render
  ----------------------------- */
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft />
          </button>

          <h1 className="text-lg font-semibold">
            Secure Payment
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Order Summary */}
        <div className="p-6 rounded-xl border space-y-3">
          <h2 className="font-semibold">Order Summary</h2>

          <div className="text-sm space-y-1">
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Charger:</strong> {slot.charger_type}</p>
            <p>
              <strong>Time:</strong>{" "}
              {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p><strong>Duration:</strong> {slot.duration_hours} hour(s)</p>
            <p><strong>Rate:</strong> ₹{slot.price_per_hour}/hr</p>
          </div>

          <div className="pt-3 border-t text-lg font-semibold">
            Total: ₹{slot.total_price.toFixed(2)}
          </div>
        </div>

        {/* UPI Payment */}
        <div className="p-6 rounded-xl border space-y-4 text-center">
          <h2 className="font-semibold">Pay using UPI</h2>

          <div className="flex justify-center">
            <QRCode value={upiPayload} size={180} />
          </div>

          <p className="text-sm text-muted-foreground">
            Scan with any UPI app (GPay, PhonePe, Paytm)
          </p>

          {!paymentSuccess ? (
            <button
              onClick={handleConfirmPayment}
              className="mt-4 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium"
            >
              I have completed the payment
            </button>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2 text-emerald-600">
              <CheckCircle className="w-6 h-6" />
              <p className="font-medium">Payment Confirmed</p>
              <p className="text-sm">
                Transaction ID: {transactionId}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default PaymentPage
