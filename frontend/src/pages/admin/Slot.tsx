import { useEffect, useState, useRef } from "react"
import AdminDashboardLayout from "../../components/layout/AdminDashboardLayout"
import { slotAPI, bookingAPI } from "../../lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { WalkInRegistrationPanel } from "@/components/WalkInRegistrationPanel"
import { 
  QrCode, 
  Clock, 
  MapPin, 
  Zap, 
  User, 
  Car, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  Play,
  Filter,
  Unlock,
  RefreshCw,
  Plus,
  ShieldAlert,
  Shield
} from "lucide-react"

// Status configuration for consistent colors
const STATUS_CONFIG = {
  available: {
    label: "Available",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
    icon: CheckCircle2,
  },
  "emergency-reserved": {
    label: "Emergency Only",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    textColor: "text-orange-400",
    icon: ShieldAlert,
  },
  occupied: {
    label: "Occupied",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    icon: Clock,
  },
  "in-progress": {
    label: "In Progress",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    icon: Zap,
  },
  missed: {
    label: "Missed",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
    icon: AlertTriangle,
  },
  cancelled: {
    label: "Cancelled",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    textColor: "text-gray-400",
    icon: XCircle,
  },
}

const getSlotStatus = (slot: any) => {
  if (slot.is_available && slot.is_emergency_reserved) return "emergency-reserved"
  if (slot.is_available) return "available"
  if (slot.booking?.status === "cancelled") return "cancelled"
  if (slot.booking?.status === "missed") return "missed"
  if (slot.booking?.status === "in_progress" || slot.booking?.status === "charging") return "in-progress"
  return "occupied"
}

const AdminSlotPage = () => {
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStationId, setSelectedStationId] = useState<string>("all")
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [qrData, setQrData] = useState<string>("")
  const [scannerEnabled, setScannerEnabled] = useState<boolean>(false)
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [freeing, setFreeing] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [togglingEmergency, setTogglingEmergency] = useState<string | null>(null)
  const videoElementId = "qr-video-preview"
  const [codeReader] = useState(() => new BrowserMultiFormatReader())
  const scannerControlsRef = useRef<any | null>(null)
  const hasScannedRef = useRef(false)

  const onDialogChange = async (open: boolean) => {
    setIsScanOpen(open)
    if (open) {
      hasScannedRef.current = false
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const deviceId = devices[0]?.deviceId
        const controls = await codeReader.decodeFromVideoDevice(deviceId ?? undefined, videoElementId, (result, err) => {
          if (result && !hasScannedRef.current) {
            hasScannedRef.current = true
            tryStartBooking(result.getText())
          }
        })
        scannerControlsRef.current = controls
      } catch (e) {
        setScanMessage("Unable to start camera. Use manual input.")
      }
    } else {
      try {
        await scannerControlsRef.current?.stop()
      } catch {}
      scannerControlsRef.current = null
    }
  }

  const stations = Array.from(
    new Map(
      slots.map(slot => [
        slot.station_id,
        {
          id: slot.station_id,
          name: slot.station_name || slot.station_id,
        },
      ])
    ).values()
  )

  const filteredSlots =
    selectedStationId === "all"
      ? slots
      : slots.filter(slot => slot.station_id === selectedStationId)

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await slotAPI.getAdminSlots()
        setSlots(res.data)
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [])

  const tryStartBooking = async (raw: string) => {
    try {
      let ticket_id: string | undefined
      let car_id: string | undefined
      try {
        const payload = JSON.parse(raw)
        ticket_id = payload.ticketId || payload.ticket_id
        car_id = payload.carId || payload.car_id
      } catch {
        ticket_id = raw // treat as plain ticket id
      }
      if (!ticket_id) throw new Error("Missing ticket_id")
      const res = await bookingAPI.startBooking({ ticket_id, car_id })
      setScanMessage("Booking started: " + (res.data.booking_id || ticket_id))
      // optionally close scanner after success
      onDialogChange(false)
    } catch (e: any) {
      setScanMessage(e?.response?.data?.detail || e?.message || "Failed to start booking")
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrData.trim()) return
    await tryStartBooking(qrData.trim())
    setQrData("")
  }

  const handleFreeSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to free this slot? This will make it available for new bookings.")) {
      return
    }
    setFreeing(slotId)
    try {
      await slotAPI.resetSlot(slotId)
      // Update local state
      setSlots(prev => prev.map(s => 
        s.slot_id === slotId 
          ? { ...s, is_available: true, booking: null }
          : s
      ))
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to free slot")
    } finally {
      setFreeing(null)
    }
  }

  const handleGenerateSlots = async () => {
    if (selectedStationId === "all") {
      alert("Please select a specific station first")
      return
    }
    
    if (!confirm("Generate new slots for the next 3 days (8 AM - 10 PM) for all chargers at this station?")) {
      return
    }
    
    setGenerating(true)
    try {
      const res = await slotAPI.generateSlotsForStation(selectedStationId)
      alert(res.data?.message || "Slots generated!")
      
      // Refresh slots list
      const slotsRes = await slotAPI.getAdminSlots()
      setSlots(slotsRes.data)
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to generate slots. Make sure the station has chargers.")
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleEmergencyReserved = async (slotId: string, currentValue: boolean) => {
    setTogglingEmergency(slotId)
    try {
      await slotAPI.toggleEmergencyReserved(slotId, !currentValue)
      // Update local state
      setSlots(prev => prev.map(s => 
        s.slot_id === slotId 
          ? { ...s, is_emergency_reserved: !currentValue }
          : s
      ))
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to update slot")
    } finally {
      setTogglingEmergency(null)
    }
  }

  return (
    <AdminDashboardLayout userName="Admin User">
      <div className="space-y-6 p-6 md:p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Slot Management</h1>
            <p className="text-sm text-white/50 mt-1">Manage charging slots and scan tickets</p>
          </div>
          
          {/* Station Filter & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-white/70">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter:</span>
            </div>
            <select
              value={selectedStationId}
              onChange={e => setSelectedStationId(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="all">All Stations</option>
              {stations.map(station => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleGenerateSlots}
              disabled={generating || selectedStationId === "all"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {generating ? "Generating..." : "Generate Slots"}
            </button>
          </div>
        </div>

        {/* Operation Panels - Scan Ticket & Walk-In Registration */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scan Ticket Card */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Scan Ticket</h2>
                  <p className="text-xs text-white/50">Scan or enter ticket ID to start charging</p>
                </div>
              </div>
              
              <Dialog open={isScanOpen} onOpenChange={onDialogChange}>
                <DialogTrigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition">
                    <QrCode className="w-4 h-4" /> Scan QR
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-[#0a1016] border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Scan Ticket QR</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden bg-black aspect-video border border-white/10">
                      <video id={videoElementId} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-white/50">If the QR cannot be recognized, paste the payload below.</p>
                    <form onSubmit={handleManualSubmit} className="space-y-3">
                      <label className="text-sm text-white/70">QR Payload (JSON)</label>
                      <textarea
                        className="w-full h-24 p-3 border border-white/10 bg-black/40 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder='{"ticketId":"...","carId":"..."}'
                        value={qrData}
                        onChange={e => setQrData(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <button 
                          type="button" 
                          onClick={() => onDialogChange(false)} 
                          className="px-4 py-2 rounded-full border border-white/10 text-white text-sm hover:bg-white/5 transition"
                        >
                          Close
                        </button>
                        <button 
                          type="submit" 
                          className="px-4 py-2 rounded-full bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition"
                        >
                          Start Booking
                        </button>
                      </div>
                    </form>
                    {scanMessage && (
                      <p className={`text-sm ${scanMessage.includes("started") ? "text-emerald-400" : "text-red-400"}`}>
                        {scanMessage}
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Manual Input */}
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
              <input
                className="flex-1 px-4 py-3 border border-white/10 bg-black/40 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder='Enter Ticket ID (e.g., TICKET-xxxxx)'
                value={qrData}
                onChange={e => setQrData(e.target.value)}
              />
              <button 
                type="submit" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/30 transition"
              >
                <Play className="w-4 h-4" /> Start Session
              </button>
            </form>
            {scanMessage && (
              <p className={`mt-3 text-sm ${scanMessage.includes("started") ? "text-emerald-400" : "text-red-400"}`}>
                {scanMessage}
              </p>
            )}
          </div>

          {/* Walk-In Registration Panel */}
          <WalkInRegistrationPanel
            stations={stations}
            onBookingCreated={async () => {
              // Refresh slots after walk-in booking
              const res = await slotAPI.getAdminSlots()
              setSlots(res.data)
            }}
          />
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon
            return (
              <div key={key} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} border ${config.borderColor}`}>
                <Icon className={`w-3.5 h-3.5 ${config.textColor}`} />
                <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
              </div>
            )
          })}
        </div>

        {/* Slots Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50">Loading slots…</p>
            </div>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No slots found</p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSlots.map(slot => {
              const statusKey = getSlotStatus(slot)
              const status = STATUS_CONFIG[statusKey as keyof typeof STATUS_CONFIG]
              const StatusIcon = status.icon
              
              return (
                <div
                  key={slot.slot_id}
                  className={`rounded-2xl border ${status.borderColor} ${status.bgColor} p-5 transition hover:border-opacity-60`}
                >
                  {/* Slot Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} 
                        <span className="text-white/40 mx-1">–</span> 
                        {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        {new Date(slot.start_time).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bgColor} border ${status.borderColor}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${status.textColor}`} />
                      <span className={`text-xs font-medium ${status.textColor}`}>{status.label}</span>
                    </div>
                  </div>

                  {/* Station Info */}
                  <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{slot.station_name || "Unknown Station"}</span>
                  </div>

                  {/* Charger Info */}
                  {slot.charger_type && (
                    <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{slot.charger_type}</span>
                    </div>
                  )}

                  {/* Booking Details */}
                  {!slot.is_available && slot.booking && (
                    <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                      <p className="text-xs uppercase tracking-wider text-white/40 font-medium">Booking Details</p>
                      
                      <div className="flex items-center gap-2 text-sm text-white">
                        <User className="w-3.5 h-3.5 text-white/50" />
                        <span>{slot.booking.user?.name || "Unknown User"}</span>
                      </div>
                      
                      {slot.booking.car && (
                        <div className="flex items-center gap-2 text-sm text-white">
                          <Car className="w-3.5 h-3.5 text-white/50" />
                          <span>
                            {slot.booking.car.brand} {slot.booking.car.model}
                            {slot.booking.car.car_number && (
                              <span className="text-white/50 ml-1">({slot.booking.car.car_number})</span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      {slot.booking.ticket_id && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <p className="text-xs text-white/40">
                            Ticket: <span className="text-white/70 font-mono">{slot.booking.ticket_id}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Free Slot Button - show for occupied/non-available slots */}
                  {!slot.is_available && (
                    <button
                      onClick={() => handleFreeSlot(slot.slot_id)}
                      disabled={freeing === slot.slot_id}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium hover:bg-amber-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Unlock className="w-4 h-4" />
                      {freeing === slot.slot_id ? "Freeing..." : "Free Slot"}
                    </button>
                  )}

                  {/* Toggle Emergency Reserved - show for available slots */}
                  {slot.is_available && (
                    <button
                      onClick={() => handleToggleEmergencyReserved(slot.slot_id, slot.is_emergency_reserved)}
                      disabled={togglingEmergency === slot.slot_id}
                      className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        slot.is_emergency_reserved
                          ? "bg-orange-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
                          : "bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                      }`}
                    >
                      {slot.is_emergency_reserved ? (
                        <>
                          <Shield className="w-4 h-4" />
                          {togglingEmergency === slot.slot_id ? "Updating..." : "Remove Emergency Reserve"}
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4" />
                          {togglingEmergency === slot.slot_id ? "Updating..." : "Mark as Emergency Reserved"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  )
}

export default AdminSlotPage
