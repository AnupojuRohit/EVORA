import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Zap, Clock, Car, MapPin, CreditCard, AlertCircle } from "lucide-react"
import { stationAPI } from "@/lib/api"

interface Slot {
  id: string
  start_time: string
  end_time: string
  is_available: boolean
}

interface Charger {
  id: string
  charger_type: string
  power_kw: number
  price_per_hour: number
  name?: string
  slots: Slot[]
}

// Helper to safely format time
const formatTime = (iso: string) => {
  if (!iso) return "--:--"
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const formatDateTime = (iso: string) => {
  const date = new Date(iso)
  return {
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: date.toLocaleDateString([], { month: "short", day: "numeric" })
  }
}

export default function SlotSelectionPage() {
  const { stationId } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation() as { state: any }
  
  // Safe destructuring with fallback
  const station = state?.station
  const vehicle = state?.vehicle

  const [chargers, setChargers] = useState<Charger[]>([])
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirect if essential state is missing
  useEffect(() => {
    if (!station || !vehicle) {
      navigate("/dashboard", { replace: true })
    }
  }, [station, vehicle, navigate])

  useEffect(() => {
    if (!stationId) return

    setLoading(true)
    stationAPI.getChargersWithSlots(stationId)
      .then(res => {
        const now = new Date()
        const processedChargers = res.data.map((c: any) => {
          // Filter for future available slots
          const futureSlots = c.slots.filter((s: any) => 
            s.is_available && new Date(s.start_time) > now
          )
          
          // Fallback: if no future slots (for demo/testing), show all available
          const availableSlots = futureSlots.length > 0 
            ? futureSlots 
            : c.slots.filter((s: any) => s.is_available)

          return { ...c, slots: availableSlots }
        })
        setChargers(processedChargers)
      })
      .catch((err) => {
        console.error("Failed to fetch chargers:", err)
      })
      .finally(() => setLoading(false))
  }, [stationId])

  // Memoized calculations
  const duration = selectedSlot
    ? (new Date(selectedSlot.end_time).getTime() - new Date(selectedSlot.start_time).getTime()) / 3600000
    : 0

  const total = selectedCharger ? duration * selectedCharger.price_per_hour : 0

  if (!station || !vehicle) return null // Prevent flash of empty content

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(34,211,238,0.12),_transparent_50%)]" />
        <div className="relative p-6 lg:p-10 space-y-8">

          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-3 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Station Selection
              </button>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Charging Session</p>
              <h1 className="text-3xl font-semibold tracking-tight">Select Charging Slot</h1>
            </div>
            <div className="md:text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                System Online
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              
              {/* VEHICLE & STATION INFO CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white/5 border border-white/10 p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <img src="/car.jpg" alt="Vehicle" className="w-14 h-14 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-semibold">{vehicle.brand} {vehicle.model}</h3>
                      <p className="text-slate-400 text-xs">{vehicle.car_number}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/5 border border-white/10 p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-semibold truncate">{station.name}</h3>
                      <p className="text-slate-400 text-xs truncate">{station.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHARGER SELECTION */}
              <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="w-5 h-5 text-emerald-300" />
                  <h3 className="text-lg font-semibold">Select Charger</h3>
                </div>

                {loading ? (
                  <div className="py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : chargers.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No chargers compatible with your vehicle found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chargers.map(charger => (
                      <button
                        key={charger.id}
                        onClick={() => { setSelectedCharger(charger); setSelectedSlot(null); }}
                        className={`p-5 rounded-2xl border text-left transition-all ${
                          selectedCharger?.id === charger.id
                            ? "border-emerald-400/50 bg-emerald-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <h4 className="font-semibold">{charger.name || charger.charger_type}</h4>
                        <p className="text-slate-400 text-sm">{charger.power_kw} kW • ₹{charger.price_per_hour}/hr</p>
                        <div className="mt-3 text-xs text-emerald-300 bg-emerald-500/10 w-fit px-2 py-1 rounded">
                          {charger.slots.length} slots available
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SLOT SELECTION */}
              {selectedCharger && (
                <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-5 h-5 text-emerald-300" />
                    <h3 className="text-lg font-semibold">Available Slots</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedCharger.slots.map(slot => {
                      const { time, date } = formatDateTime(slot.start_time)
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-4 rounded-xl border transition-all text-center ${
                            selectedSlot?.id === slot.id
                              ? "border-emerald-400 bg-emerald-500/20"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="font-bold">{time}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{date}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SUMMARY COLUMN */}
            <div className="xl:col-span-1">
              <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sticky top-8 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-300" />
                  Booking Summary
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-500">Vehicle</span>
                    <span>{vehicle.model}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-500">Type</span>
                    <span className="text-emerald-400">{selectedCharger?.charger_type || "--"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-500">Time</span>
                    <span>{selectedSlot ? formatTime(selectedSlot.start_time) : "--"}</span>
                  </div>
                  <div className="flex justify-between pt-4 text-base font-bold">
                    <span>Estimated Total</span>
                    <span className="text-emerald-400">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  disabled={!selectedSlot}
                  onClick={() => navigate("/booking/payment", {
                    state: {
                      stationId: station.id,
                      carId: vehicle.id,
                      station,
                      slot: {
                        ...selectedSlot,
                        charger_type: selectedCharger!.charger_type,
                        total_price: total,
                        duration_hours: duration
                      }
                    }
                  })}
                  className="w-full mt-8 py-4 rounded-2xl font-bold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
                >
                  Confirm & Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}