import { useEffect, useState, useRef } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { slotAPI, bookingAPI } from "../../lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BrowserMultiFormatReader } from "@zxing/browser"

const AdminSlotPage = () => {
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStationId, setSelectedStationId] = useState<string>("all")
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [qrData, setQrData] = useState<string>("")
  const [scannerEnabled, setScannerEnabled] = useState<boolean>(false)
  const [isScanOpen, setIsScanOpen] = useState(false)
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

  return (
    <DashboardLayout userType="admin" userName="Admin User">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Slot Management</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl border bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium">Scan Ticket</p>
              <Dialog open={isScanOpen} onOpenChange={onDialogChange}>
                <DialogTrigger asChild>
                  <button className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground">Scan QR</button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Scan Ticket QR</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="rounded-lg overflow-hidden bg-black aspect-video">
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video id={videoElementId} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-muted-foreground">If the QR cannot be recognized, paste the payload below.</p>
                    <form onSubmit={handleManualSubmit} className="space-y-2">
                      <label className="text-sm">QR Payload (JSON)</label>
                      <textarea
                        className="w-full h-24 p-2 border rounded"
                        placeholder='{"ticketId":"...","carId":"..."}'
                        value={qrData}
                        onChange={e => setQrData(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => onDialogChange(false)} className="px-3 py-2 rounded border">Close</button>
                        <button type="submit" className="px-3 py-2 rounded bg-primary text-primary-foreground">Start Booking</button>
                      </div>
                    </form>
                    {scanMessage && <p className="text-sm text-muted-foreground">{scanMessage}</p>}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Manual fallback on page too */}
            <form onSubmit={handleManualSubmit} className="mt-3 space-y-2">
              <label className="text-sm">Ticket ID</label>
              <input
                className="w-full p-2 border rounded"
                placeholder='TICKET-...'
                value={qrData}
                onChange={e => setQrData(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-2 rounded bg-primary text-primary-foreground">Start Booking</button>
                {scanMessage && <span className="text-sm text-muted-foreground self-center">{scanMessage}</span>}
              </div>
            </form>
          </div>

          <div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">
                Filter by Station
              </label>

              <select
                value={selectedStationId}
                onChange={e => setSelectedStationId(e.target.value)}
                className="input max-w-xs"
              >
                <option value="all">All Stations</option>

                {stations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
            {loading ? (
              <p className="text-muted-foreground">Loading slots…</p>
            ) : (
              <div className="space-y-4">
                {filteredSlots.map(slot => (
                  <div
                    key={slot.slot_id}
                    className="p-4 rounded-xl border bg-white"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {new Date(slot.start_time).toLocaleTimeString()} –{" "}
                          {new Date(slot.end_time).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status:{" "}
                          <span
                            className={
                              slot.is_available
                                ? "text-emerald-600"
                                : "text-red-600"
                            }
                          >
                            {slot.is_available ? "Available" : "Occupied"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {!slot.is_available && slot.booking && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/40 text-sm">
                        <p className="font-medium">Booking Details</p>
                        <p>User: {slot.booking.user?.name}</p>
                        <p>
                          Car: {slot.booking.car?.brand}{" "}
                          {slot.booking.car?.model}
                        </p>
                        <p>Number: {slot.booking.car?.car_number}</p>
                        <p>Status: {slot.booking.status}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminSlotPage
