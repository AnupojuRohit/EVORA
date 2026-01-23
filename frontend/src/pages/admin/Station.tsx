import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin, Zap, ArrowLeft } from "lucide-react"
import { stationAPI, chargerAPI } from "@/lib/api"
import { useNavigate } from "react-router-dom"

const chargerTypes = ["Type 1", "Type 2", "CCS2", "CHAdeMO", "GB/T"]

const AdminStationPage = () => {
  const [stations, setStations] = useState<any[]>([])
  const navigate = useNavigate()
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null)
  const [form, setForm] = useState({
    name: "",
    address: "",
    charger_name: "",
    charger_type: chargerTypes[0],
    power_kw: 22,
    price_per_hour: 100,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchStations() }, [])

  const fetchStations = async () => {
    setLoading(true)
    try {
      const res = await stationAPI.getStations()
      setStations(res.data)
    } catch (err) {
      setStations([])
    } finally {
      setLoading(false)
    }
  }

  function MapClickHandler() {
    useMapEvents({
      click(e) { setSelectedLocation([e.latlng.lat, e.latlng.lng]) },
    })
    return null
  }

  const handleFormChange = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handlePublish = async () => {
    if (!selectedLocation) return

    const stationRes = await stationAPI.addStation({
      name: form.name,
      address: form.address,
      latitude: String(selectedLocation[0]),
      longitude: String(selectedLocation[1]),
      host_id: 'admin-host-id',
    })
    const stationId = stationRes.data.id as string

    await chargerAPI.addCharger(stationId, {
      charger_type: form.charger_type,
      power_kw: Number(form.power_kw),
      price_per_hour: Number(form.price_per_hour),
    })

    setSelectedLocation(null)
    setForm({
      name: "",
      address: "",
      charger_name: "",
      charger_type: chargerTypes[0],
      power_kw: 22,
      price_per_hour: 100,
    })
    fetchStations()
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <div className="w-full md:w-[380px] bg-white border-r border-border z-10 flex flex-col">
        <div className="p-5 border-b space-y-3">
          <button onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div>
            <h1 className="text-lg font-semibold">Create Station</h1>
            <p className="text-sm text-muted-foreground mt-1">Pick a location, add a charger.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="w-4 h-4" /> Selected Location</div>
            <div className="p-4 rounded-xl border bg-muted/40">
              {selectedLocation ? (
                <p className="text-sm font-medium">Lat: {selectedLocation[0].toFixed(5)}, Lng: {selectedLocation[1].toFixed(5)}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Click on map to select location</p>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="w-4 h-4" /> Station Details</div>
            <div className="space-y-3">
              <input className="input" placeholder="Station Name" value={form.name} onChange={e => handleFormChange("name", e.target.value)} />
              <input className="input" placeholder="Address" value={form.address} onChange={e => handleFormChange("address", e.target.value)} />
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium"><Zap className="w-4 h-4" /> Charger Configuration</div>
            <select className="input" value={form.charger_type} onChange={e => handleFormChange("charger_type", e.target.value)}>{chargerTypes.map(type => <option key={type} value={type}>{type}</option>)}</select>
            <input type="number" className="input" placeholder="Power (kW)" value={form.power_kw} onChange={e => handleFormChange("power_kw", Number(e.target.value))} />
            <input type="number" className="input" placeholder="Price per hour" value={form.price_per_hour} onChange={e => handleFormChange("price_per_hour", Number(e.target.value))} />
          </div>

          <div className="pt-4 border-t">
            <button disabled={!selectedLocation || !form.name || !form.address} onClick={handlePublish} className={`w-full py-3 rounded-xl font-medium ${!selectedLocation ? "bg-emerald-600/50 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"} text-white transition`}>
              Publish Station
            </button>
          </div>

          <div className="pt-6">
            <h2 className="text-sm font-medium mb-3">Existing Stations</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading stations…</p>
            ) : stations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stations created yet</p>
            ) : (
              <div className="space-y-3">
                {stations.map((station: any) => (
                  <div key={station.id} className="p-3 rounded-xl border bg-muted/30">
                    <p className="font-medium">{station.name}</p>
                    <p className="text-xs text-muted-foreground">{station.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={[28.6139, 77.209]} zoom={13} className="h-full w-full">
          <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler />
          {stations.map((station: any) => (
            <Marker key={station.id} position={[Number(station.latitude), Number(station.longitude)]} />
          ))}
          {selectedLocation && <Marker position={selectedLocation} />}
        </MapContainer>
      </div>
    </div>
  )
}

export default AdminStationPage