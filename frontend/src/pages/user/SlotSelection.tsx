import { useEffect, useState } from "react"
import { useParams, useNavigate ,useLocation} from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { stationAPI } from "@/lib/api"

interface Slot { id: string; start_time: string; end_time: string; is_available: boolean }
interface Charger { id: string; charger_type: string; power_kw: number; price_per_hour: number; name?: string; slots: Slot[] }

const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

const SlotSelectionPage = () => {
  const { stationId } = useParams()
  const navigate = useNavigate()

  const [chargers, setChargers] = useState<Charger[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  const location = useLocation()
  const state = location.state as any
  const { station, vehicle } = state || {}

  useEffect(() => { if (!station || !vehicle) navigate("/dashboard") }, [station, vehicle, navigate])

  useEffect(() => {
    if (!stationId) return
    if (chargers.length > 0) return // prevent reset on back navigation
    const fetch = async () => {
      try {
        const res = await stationAPI.getChargersWithSlots(stationId)
        const data: Charger[] = (res.data || []).map((c: any) => ({
          id: c.id,
          charger_type: c.charger_type,
          power_kw: c.power_kw,
          price_per_hour: c.price_per_hour,
          name: c.name,
          slots: (c.slots || []).filter((s: any) => s.is_available),
        }))
        setChargers(data)
      } catch (e) {
        console.error(e)
      } finally { setLoading(false) }
    }
    fetch()
  }, [stationId])

  const onChoose = (chargerId: string, slotId: string) => {
    setSelectedChargerId(chargerId)
    setSelectedSlotId(slotId)
  }

  const selectedCharger = chargers.find(c => c.id === selectedChargerId) || null
  const selectedSlot = selectedCharger?.slots.find(s => s.id === selectedSlotId) || null

  const durationHours = selectedSlot ? (new Date(selectedSlot.end_time).getTime() - new Date(selectedSlot.start_time).getTime()) / 3600000 : 0
  const totalPrice = selectedCharger && selectedSlot ? durationHours * selectedCharger.price_per_hour : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 space-y-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-xl font-semibold">Select Charging Slot</h1>
          <p className="text-sm text-muted-foreground">Choose a charger and select a slot</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading available slots…</p>
        ) : chargers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chargers/slots found for this station.</p>
        ) : (
          <div className="space-y-6">
            {chargers.map(charger => (
              <div key={charger.id} className="border rounded-xl p-4 space-y-4">
                <div>
                  <p className="font-medium text-base">{charger.name || `${charger.charger_type} Charger`}</p>
                  <p className="text-sm text-muted-foreground flex gap-3">
                    <span>{charger.power_kw} kW</span>
                    <span>₹{charger.price_per_hour}/hr</span>
                  </p>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {charger.slots.map(slot => {
                    const isSelected = selectedSlotId === slot.id
                    const disabled = selectedChargerId && selectedChargerId !== charger.id
                    return (
                      <button
                        key={slot.id}
                        disabled={disabled}
                        onClick={() => onChoose(charger.id, slot.id)}
                        className={`py-2 text-xs rounded-lg font-medium transition ${
                          isSelected ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {formatTime(slot.start_time)}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedCharger && selectedSlot && (
          <div className="border rounded-xl p-4 space-y-2 bg-muted/20">
            <p className="font-medium">Selected Session</p>
            <p className="text-sm">Time: {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}</p>
            <p className="text-sm">Duration: {durationHours} hour(s)</p>
            <p className="text-sm">Price: ₹{selectedCharger.price_per_hour}/hour</p>
            <p className="text-sm font-semibold">Total: ₹{totalPrice.toFixed(2)}</p>
            <button
              onClick={() => navigate("/booking/payment", {
                state: {
                  stationId: station.id,
                  carId: vehicle.id,
                  station,
                  slot: {
                    id: selectedSlot.id,
                    start_time: selectedSlot.start_time,
                    end_time: selectedSlot.end_time,
                    charger_type: selectedCharger.charger_type,
                    price_per_hour: selectedCharger.price_per_hour,
                    duration_hours: durationHours,
                    total_price: totalPrice,
                  },
                },
              })}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SlotSelectionPage
