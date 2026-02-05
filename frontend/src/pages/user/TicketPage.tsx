import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import QRCode from "react-qr-code"
import { MapPin, AlertTriangle, ArrowLeft, Clock3 } from "lucide-react"

interface TicketSlot {
  id: string
  start_time: string
  end_time: string
  charger_type: string
  total_price: number
}

const TicketPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { ticketId, slot, station, transactionId, amount, qrPayload } =
    (location.state as {
      ticketId: string
      slot: TicketSlot
      station: { latitude: number; longitude: number; name?: string }
      transactionId?: string
      amount?: number
      qrPayload?: string
    }) || {}

  const [arrivalDeadline] = useState(() => Date.now() + 20 * 60 * 1000)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const countdownLabel = useMemo(() => {
    const remaining = arrivalDeadline - now
    if (remaining <= 0) return "00:00"
    const totalSeconds = Math.floor(remaining / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }, [arrivalDeadline, now])

  if (!ticketId || !slot || !station) {
    return (
      <div className="min-h-screen bg-[#070b10] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ticket</p>
          <h1 className="text-xl font-semibold">Ticket not found</h1>
          <p className="text-sm text-slate-400">
            Your ticket details are not available. Please check your bookings or return to the dashboard.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full rounded-full border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/5"
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
                    <h2 className="text-lg font-semibold">Reach within 20 minutes</h2>
                  </div>
                  <Clock3 className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                  <p className="text-3xl font-semibold text-emerald-200">{countdownLabel}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {arrivalDeadline - now > 0
                      ? "Arrival window active"
                      : "Arrival window elapsed. Penalty may apply."}
                  </p>
                </div>
                <div className="flex gap-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-400/20 p-3 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <p>
                    Arrive on time to avoid cancellation or penalty charges.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment</p>
                <div className="text-sm space-y-2">
                  {transactionId && (
                    <p>
                      <span className="text-slate-400">Transaction ID:</span> {transactionId}
                    </p>
                  )}
                  {typeof amount === "number" && (
                    <p>
                      <span className="text-slate-400">Amount Paid:</span> ₹{amount.toFixed(2)}
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
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-emerald-500 text-slate-900 font-semibold"
                >
                  <MapPin className="w-4 h-4" /> Navigate to Station
                </a>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 rounded-full border border-white/10 text-sm text-slate-200 hover:bg-white/5"
                >
                  View My Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketPage
