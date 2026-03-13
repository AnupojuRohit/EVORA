import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import QRCode from "react-qr-code"
import {
  UserPlus,
  Car,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Ticket,
  Copy,
  Printer,
} from "lucide-react"
import { bookingAPI, stationAPI } from "@/lib/api"

interface Station {
  id: string
  name: string
}

interface Charger {
  id: string
  charger_type: string
  power_kw: number
  price_per_hour: number
}

interface Slot {
  id: string
  start_time: string
  end_time: string
  is_available: boolean
  charger_id: string
}

interface WalkInRegistrationPanelProps {
  stations?: Station[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBookingCreated?: (booking: any) => void
}

interface GeneratedTicket {
  ticketId: string
  bookingId: string
  vehicleNumber: string
  stationName: string
  chargerType: string
  timeSlot: string
  amount: number
}

export const WalkInRegistrationPanel = ({
  stations: propStations,
  onBookingCreated,
}: WalkInRegistrationPanelProps) => {
  // Form state
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedStationId, setSelectedStationId] = useState("")
  const [selectedChargerId, setSelectedChargerId] = useState("")
  const [selectedSlotId, setSelectedSlotId] = useState("")
  const [isEmergency, setIsEmergency] = useState(false)
  const [amount, setAmount] = useState<number>(100)

  // Data state
  const [stations, setStations] = useState<Station[]>([])
  const [chargers, setChargers] = useState<Charger[]>([])
  const [slots, setSlots] = useState<Slot[]>([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [loadingChargers, setLoadingChargers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedTicket, setGeneratedTicket] = useState<GeneratedTicket | null>(null)
  const [copied, setCopied] = useState(false)

  // Load stations on mount
  useEffect(() => {
    if (propStations && propStations.length > 0) {
      setStations(propStations)
    } else {
      stationAPI.getStations().then((res) => {
        setStations(res.data || [])
      }).catch(console.error)
    }
  }, [propStations])

  // Load chargers when station changes
  useEffect(() => {
    if (!selectedStationId) {
      setChargers([])
      setSelectedChargerId("")
      return
    }

    setLoadingChargers(true)
    stationAPI.getChargersWithSlots(selectedStationId).then((res) => {
      const chargersData = res.data || []
      console.log("Chargers loaded:", chargersData) // Debug log
      setChargers(chargersData)
      setSelectedChargerId("")
      setSelectedSlotId("")
    }).catch((err) => {
      console.error("Failed to load chargers:", err)
      setChargers([])
    }).finally(() => {
      setLoadingChargers(false)
    })
  }, [selectedStationId])

  // Load slots when charger changes
  useEffect(() => {
    if (!selectedChargerId) {
      setSlots([])
      setSelectedSlotId("")
      return
    }

    const charger = chargers.find((c) => c.id === selectedChargerId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (charger && (charger as any).slots) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const availableSlots = (charger as any).slots.filter((s: Slot) => s.is_available)
      setSlots(availableSlots)
      
      // Update amount based on charger price
      if (charger.price_per_hour) {
        setAmount(charger.price_per_hour)
      }
    }
  }, [selectedChargerId, chargers])

  const formatTime = (iso: string) => {
    if (!iso) return "--:--"
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!vehicleNumber.trim()) {
      setError("Vehicle number is required")
      return
    }
    if (!selectedStationId) {
      setError("Please select a station")
      return
    }
    if (!selectedChargerId) {
      setError("Please select a charger")
      return
    }
    if (!selectedSlotId) {
      setError("Please select a time slot")
      return
    }

    setLoading(true)

    try {
      const res = await bookingAPI.createWalkInBooking({
        vehicle_number: vehicleNumber.toUpperCase().trim(),
        user_name: customerName.trim() || undefined,
        user_phone: customerPhone.trim() || undefined,
        station_id: selectedStationId,
        charger_id: selectedChargerId,
        slot_id: selectedSlotId,
        is_emergency: isEmergency,
        amount,
      })

      const selectedStation = stations.find((s) => s.id === selectedStationId)
      const selectedCharger = chargers.find((c) => c.id === selectedChargerId)
      const selectedSlot = slots.find((s) => s.id === selectedSlotId)

      setGeneratedTicket({
        ticketId: res.data.ticket_id,
        bookingId: res.data.booking_id,
        vehicleNumber: vehicleNumber.toUpperCase(),
        stationName: selectedStation?.name || "Station",
        chargerType: selectedCharger?.charger_type || "Standard",
        timeSlot: selectedSlot
          ? `${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}`
          : "--",
        amount,
      })

      // Notify parent
      onBookingCreated?.(res.data)

      // Reset form
      setVehicleNumber("")
      setCustomerName("")
      setCustomerPhone("")
      setSelectedSlotId("")
      setIsEmergency(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create booking")
    } finally {
      setLoading(false)
    }
  }

  const copyTicketId = () => {
    if (generatedTicket) {
      navigator.clipboard.writeText(generatedTicket.ticketId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const printTicket = () => {
    window.print()
  }

  const closeTicketModal = () => {
    setGeneratedTicket(null)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Walk-In Registration</h3>
              <p className="text-xs text-white/60">Register on-site customers instantly</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Vehicle Number */}
          <div className="space-y-2">
            <label className="text-xs text-white/60 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" />
              Vehicle Number *
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="TS09AB1234"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition font-mono tracking-wider"
            />
          </div>

          {/* Customer Details (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-white/60">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/60">Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Station Selection */}
          <div className="space-y-2">
            <label className="text-xs text-white/60 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Station *
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400/50 focus:outline-none transition"
            >
              <option value="">Select Station</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          {/* Charger Selection */}
          {selectedStationId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <label className="text-xs text-white/60 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Charger *
              </label>
              
              {loadingChargers ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-sm text-white/50">Loading chargers...</span>
                </div>
              ) : chargers.length === 0 ? (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
                  <p className="text-sm text-amber-300">No chargers found for this station</p>
                  <p className="text-xs text-white/50 mt-1">Please add chargers to this station first</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {chargers.map((charger) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const availableSlots = (charger as any).slots?.filter((s: Slot) => s.is_available).length || 0
                    return (
                      <button
                        key={charger.id}
                        type="button"
                        onClick={() => setSelectedChargerId(charger.id)}
                        disabled={availableSlots === 0}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedChargerId === charger.id
                            ? "border-cyan-400/50 bg-cyan-500/20"
                            : availableSlots === 0
                            ? "border-white/5 bg-white/5 opacity-50 cursor-not-allowed"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <p className="font-medium text-white">{charger.charger_type}</p>
                        <p className="text-xs text-white/50">
                          {charger.power_kw} kW • ₹{charger.price_per_hour}/hr
                        </p>
                        <p className={`text-xs mt-1 ${availableSlots > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {availableSlots} slots available
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Slot Selection */}
          {selectedChargerId && slots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <label className="text-xs text-white/60 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Time Slot *
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedSlotId === slot.id
                        ? "border-cyan-400/50 bg-cyan-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <p className="font-medium text-white text-sm">{formatTime(slot.start_time)}</p>
                    <p className="text-[10px] text-white/50">to {formatTime(slot.end_time)}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Amount */}
          {selectedSlotId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <label className="text-xs text-white/60">Amount (₹)</label>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-cyan-400/50 focus:outline-none transition"
              />
            </motion.div>
          )}

          {/* Emergency Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-10 h-6 rounded-full transition-colors relative ${
                isEmergency ? "bg-amber-500" : "bg-white/20"
              }`}
              onClick={() => setIsEmergency(!isEmergency)}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  isEmergency ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
            <span className="text-sm text-white/70">
              Mark as Emergency Booking
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                Creating Booking...
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                Generate Ticket
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Generated Ticket Modal */}
      <AnimatePresence>
        {generatedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={closeTicketModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#0a1016] overflow-hidden print:border-black print:bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success Header */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Ticket Generated!</h2>
                <p className="text-sm text-white/60 mt-1">Walk-in booking created successfully</p>
              </div>

              {/* Ticket Details */}
              <div className="p-6 space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-2xl">
                    <QRCode 
                      value={JSON.stringify({
                        ticketId: generatedTicket.ticketId,
                        bookingId: generatedTicket.bookingId,
                        vehicleNumber: generatedTicket.vehicleNumber,
                      })} 
                      size={150} 
                    />
                  </div>
                </div>

                {/* Ticket ID */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-xs text-white/50">Ticket ID</p>
                    <p className="font-mono font-semibold text-white">{generatedTicket.ticketId}</p>
                  </div>
                  <button
                    onClick={copyTicketId}
                    className="p-2 rounded-lg hover:bg-white/10 transition"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-white/60" />
                    )}
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/50">Vehicle</p>
                    <p className="font-semibold text-white">{generatedTicket.vehicleNumber}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/50">Station</p>
                    <p className="font-semibold text-white truncate">{generatedTicket.stationName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/50">Charger</p>
                    <p className="font-semibold text-white">{generatedTicket.chargerType}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/50">Time Slot</p>
                    <p className="font-semibold text-white">{generatedTicket.timeSlot}</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-emerald-300">Amount</span>
                  <span className="text-2xl font-bold text-emerald-400">₹{generatedTicket.amount}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={printTicket}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={closeTicketModal}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition"
                  >
                    Done
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

export default WalkInRegistrationPanel
