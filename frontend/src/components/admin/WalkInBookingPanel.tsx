import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Users,
  Zap,
  Clock,
  Car,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  User,
  ChevronDown,
} from "lucide-react"
import QRCode from "react-qr-code"

interface WalkInBookingPanelProps {
  stations: Array<{
    id: string
    name: string
    chargers?: Array<{
      id: string
      charger_type: string
      status?: string
    }>
  }>
  slots: Array<{
    id: string
    charger_id: string
    start_time: string
    end_time: string
    is_available: boolean
  }>
  onCreateBooking: (data: WalkInBookingData) => Promise<{ ticket_id: string; booking_id: string }>
}

export interface WalkInBookingData {
  vehicleNumber: string
  userName?: string
  userPhone?: string
  stationId: string
  chargerId: string
  slotId: string
  isEmergency: boolean
  amount: number
}

const chargerTypeColors: Record<string, string> = {
  AC: "text-emerald-400",
  DC: "text-cyan-400",
  "Ultra-Fast": "text-amber-400",
}

export const WalkInBookingPanel = ({
  stations,
  slots,
  onCreateBooking,
}: WalkInBookingPanelProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [userName, setUserName] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [selectedStation, setSelectedStation] = useState<string>("")
  const [selectedCharger, setSelectedCharger] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [isEmergency, setIsEmergency] = useState(false)
  const [amount, setAmount] = useState<number>(150)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<{ ticket_id: string; booking_id: string } | null>(null)
  const [showStationDropdown, setShowStationDropdown] = useState(false)

  // Get chargers for selected station
  const selectedStationData = stations.find(s => s.id === selectedStation)
  const availableChargers = selectedStationData?.chargers || []

  // Get available slots for selected charger
  const availableSlots = slots.filter(
    s => s.charger_id === selectedCharger && s.is_available
  )

  // Reset dependent selections when parent changes
  useEffect(() => {
    setSelectedCharger("")
    setSelectedSlot("")
  }, [selectedStation])

  useEffect(() => {
    setSelectedSlot("")
  }, [selectedCharger])

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleSubmit = async () => {
    if (!vehicleNumber || !selectedStation || !selectedCharger || !selectedSlot) return

    setIsSubmitting(true)
    try {
      const result = await onCreateBooking({
        vehicleNumber: vehicleNumber.toUpperCase(),
        userName: userName || undefined,
        userPhone: userPhone || undefined,
        stationId: selectedStation,
        chargerId: selectedCharger,
        slotId: selectedSlot,
        isEmergency,
        amount,
      })
      setCreatedTicket(result)
    } catch (error) {
      console.error("Walk-in booking failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setVehicleNumber("")
    setUserName("")
    setUserPhone("")
    setSelectedStation("")
    setSelectedCharger("")
    setSelectedSlot("")
    setIsEmergency(false)
    setAmount(150)
    setCreatedTicket(null)
  }

  // Success State - Show QR Ticket
  if (createdTicket) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-[#0a1016] p-6 space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white">Booking Created!</h3>
          <p className="text-sm text-white/50 mt-1">
            {isEmergency ? "Emergency" : "Walk-In"} booking confirmed
          </p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/40 p-6">
          <div className="rounded-2xl bg-white p-4 mb-4">
            <QRCode value={createdTicket.ticket_id} size={180} />
          </div>
          <p className="text-sm text-white/70">Ticket ID</p>
          <p className="font-mono text-lg text-emerald-300">{createdTicket.ticket_id}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-white/50">Vehicle</p>
            <p className="text-white font-medium">{vehicleNumber}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-white/50">Amount</p>
            <p className="text-white font-medium">₹{amount}</p>
          </div>
        </div>

        <button
          onClick={resetForm}
          className="w-full rounded-xl border border-white/10 py-3 text-white/70 hover:bg-white/5 transition"
        >
          Create Another Booking
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-cyan-500/30 bg-[#0a1016] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Walk-In Booking</h3>
            <p className="text-xs text-white/50">Create booking for on-site customer</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-5 space-y-4">
        {/* Vehicle Number */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/60 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5" /> Vehicle Number *
          </label>
          <input
            type="text"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            placeholder="TS09AB1234"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
        </div>

        {/* Customer Info (Optional) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-white/60 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Customer Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Phone</label>
            <input
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
            />
          </div>
        </div>

        {/* Station Selection */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/60">Station *</label>
          <div className="relative">
            <button
              onClick={() => setShowStationDropdown(!showStationDropdown)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm text-white flex items-center justify-between hover:bg-white/10 transition"
            >
              <span className={selectedStation ? "text-white" : "text-white/30"}>
                {selectedStation
                  ? stations.find(s => s.id === selectedStation)?.name
                  : "Select station"}
              </span>
              <ChevronDown className={`w-4 h-4 text-white/50 transition ${showStationDropdown ? "rotate-180" : ""}`} />
            </button>
            {showStationDropdown && (
              <div className="absolute z-10 w-full mt-1 rounded-xl border border-white/10 bg-[#0a1016] shadow-xl max-h-40 overflow-y-auto">
                {stations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => {
                      setSelectedStation(station.id)
                      setShowStationDropdown(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition ${
                      selectedStation === station.id ? "text-cyan-300 bg-cyan-500/10" : "text-white"
                    }`}
                  >
                    {station.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Charger Selection */}
        {selectedStation && (
          <div className="space-y-1.5">
            <label className="text-xs text-white/60 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Charger *
            </label>
            <div className="flex flex-wrap gap-2">
              {availableChargers.length > 0 ? (
                availableChargers.map((charger) => (
                  <button
                    key={charger.id}
                    onClick={() => setSelectedCharger(charger.id)}
                    className={`px-3 py-2 rounded-xl border text-sm transition ${
                      selectedCharger === charger.id
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span className={chargerTypeColors[charger.charger_type] || "text-white"}>
                      {charger.charger_type}
                    </span>
                    <span className="text-white/40 ml-1.5 text-xs">
                      #{charger.id.slice(-4)}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-white/40">No chargers available</p>
              )}
            </div>
          </div>
        )}

        {/* Slot Selection */}
        {selectedCharger && (
          <div className="space-y-1.5">
            <label className="text-xs text-white/60 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Time Slot *
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`px-3 py-2 rounded-xl border text-sm transition ${
                      selectedSlot === slot.id
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </button>
                ))
              ) : (
                <p className="text-sm text-white/40">No slots available</p>
              )}
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/60">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={0}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
        </div>

        {/* Emergency Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${isEmergency ? "text-amber-400" : "text-white/40"}`} />
            <span className="text-sm text-white/70">Mark as Emergency</span>
          </div>
          <button
            onClick={() => setIsEmergency(!isEmergency)}
            className={`w-12 h-6 rounded-full transition ${
              isEmergency ? "bg-amber-500" : "bg-white/20"
            }`}
          >
            <motion.div
              animate={{ x: isEmergency ? 24 : 2 }}
              className="w-5 h-5 rounded-full bg-white shadow"
            />
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!vehicleNumber || !selectedStation || !selectedCharger || !selectedSlot || isSubmitting}
          className={`w-full rounded-xl py-3 font-medium flex items-center justify-center gap-2 transition ${
            vehicleNumber && selectedStation && selectedCharger && selectedSlot && !isSubmitting
              ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-black hover:opacity-90"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              Create Booking & Generate QR
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default WalkInBookingPanel
