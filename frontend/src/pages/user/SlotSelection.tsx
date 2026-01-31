import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Zap, Clock, Car, MapPin, CreditCard } from "lucide-react"
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

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

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
  const { state } = useLocation() as any
  const { station, vehicle } = state || {}

  const [chargers, setChargers] = useState<Charger[]>([])
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!station || !vehicle) navigate("/dashboard")
  }, [])

  useEffect(() => {
    if (!stationId) return

    setLoading(true)
    stationAPI.getChargersWithSlots(stationId).then(res => {
      const now = new Date()
      // For demo purposes, if no future slots, show all available slots
      const processedChargers = res.data.map((c: any) => {
        const futureSlots = c.slots.filter((s: any) => s.is_available && new Date(s.start_time) > now)
        // If no future slots, show next available slots (remove time filter for demo)
        const availableSlots = futureSlots.length > 0 ? futureSlots : c.slots.filter((s: any) => s.is_available)
        return {
          ...c,
          slots: availableSlots
        }
      })
      setChargers(processedChargers)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [stationId])

  const duration =
    selectedSlot
      ? (new Date(selectedSlot.end_time).getTime() -
          new Date(selectedSlot.start_time).getTime()) /
        3600000
      : 0

  const total =
    selectedCharger && selectedSlot
      ? duration * selectedCharger.price_per_hour
      : 0

  return (
    <div className="min-h-screen bg-ambient text-white overflow-hidden">
      <div className="p-10 space-y-8 relative">

        {/* Ambient Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="animate-fade-up">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Station Selection
            </button>
            <h1 className="text-4xl font-bold tracking-tight animate-neon bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Select Charging Slot
            </h1>
            <p className="text-white/70 text-lg mt-2">Choose your preferred time slot for charging</p>
          </div>
          <div className="text-right animate-slide-in-right">
            <div className="text-sm text-emerald-400 font-medium animate-glow">System Online</div>
            <div className="text-xs text-white/50">Real-time availability</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* LEFT COLUMN - Vehicle & Charger Selection */}
          <div className="xl:col-span-2 space-y-8">

            {/* VEHICLE INFO */}
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src="/car.jpg"
                    alt={`${vehicle?.brand} ${vehicle?.model}`}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Car className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{vehicle?.brand} {vehicle?.model}</h3>
                  <p className="text-white/60">{vehicle?.car_number}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                    {vehicle?.charger_type}
                  </span>
                </div>
              </div>
            </div>

            {/* STATION INFO */}
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{station?.name}</h3>
                  <p className="text-white/60">{station?.address}</p>
                  <div className="flex gap-2 mt-2">
                    {station?.supported_charger_types?.map((type: string) => (
                      <span key={type} className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CHARGER SELECTION */}
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl font-semibold">Select Charger</h3>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-white/50">Loading available chargers...</p>
                </div>
              ) : chargers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/50 mb-4">No chargers available at this station</p>
                  <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition"
                  >
                    Choose Different Station
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chargers.map(charger => (
                    <div
                      key={charger.id}
                      onClick={() => {
                        setSelectedCharger(charger)
                        setSelectedSlot(null)
                      }}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        selectedCharger?.id === charger.id
                          ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{charger.name || charger.charger_type}</h4>
                          <p className="text-white/60 text-sm">{charger.power_kw} kW • ₹{charger.price_per_hour}/hr</p>
                        </div>
                      </div>
                      <div className="text-sm text-emerald-400 font-medium">
                        {charger.slots.length} slots available
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SLOT SELECTION */}
            {selectedCharger && (
              <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xl font-semibold">Select Time Slot</h3>
                </div>

                {selectedCharger.slots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/50">No available slots for this charger</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedCharger.slots.map(slot => {
                      const { time, date } = formatDateTime(slot.start_time)
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-4 rounded-xl border transition-all duration-200 text-center ${
                            selectedSlot?.id === slot.id
                              ? "border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/20"
                              : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="text-lg font-semibold">{time}</div>
                          <div className="text-xs text-white/60">{date}</div>
                          <div className="text-xs text-emerald-400 mt-1">
                            {duration.toFixed(1)}h • ₹{total.toFixed(0)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT COLUMN - Booking Summary */}
          <div className="space-y-8">

            {/* BOOKING SUMMARY */}
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-8 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl font-semibold">Booking Summary</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-white/70">Vehicle</span>
                  <span className="font-medium">{vehicle?.brand} {vehicle?.model}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-white/70">Station</span>
                  <span className="font-medium">{station?.name}</span>
                </div>

                {selectedCharger && (
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-white/70">Charger</span>
                    <span className="font-medium">{selectedCharger.name || selectedCharger.charger_type}</span>
                  </div>
                )}

                {selectedSlot && (
                  <>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-white/70">Time Slot</span>
                      <span className="font-medium">{formatTime(selectedSlot.start_time)}</span>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-white/70">Duration</span>
                      <span className="font-medium">{duration.toFixed(1)} hours</span>
                    </div>

                    <div className="flex justify-between items-center py-3 text-lg font-semibold">
                      <span>Total Cost</span>
                      <span className="text-emerald-400">₹{total.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                disabled={!selectedSlot || !selectedCharger}
                onClick={() =>
                  navigate("/booking/payment", {
                    state: {
                      stationId: station.id,
                      carId: vehicle.id,
                      station,
                      slot: {
                        id: selectedSlot!.id,
                        start_time: selectedSlot!.start_time,
                        end_time: selectedSlot!.end_time,
                        charger_type: selectedCharger!.charger_type,
                        price_per_hour: selectedCharger!.price_per_hour,
                        duration_hours: duration,
                        total_price: total,
                      },
                    },
                  })
                }
                className={`w-full mt-6 py-4 rounded-2xl font-semibold transition-all duration-200 ${
                  !selectedSlot || !selectedCharger
                    ? "bg-white/10 text-white/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-400 to-teal-400 text-black hover:opacity-90 shadow-lg hover:shadow-emerald-500/25"
                }`}
              >
                Proceed to Payment
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
