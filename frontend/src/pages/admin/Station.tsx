import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin, Zap, ArrowLeft, Plus, Building2, Clock, IndianRupee, Activity, ChevronRight } from "lucide-react"
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
  const [showForm, setShowForm] = useState(false)

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
      click(e) { 
        setSelectedLocation([e.latlng.lat, e.latlng.lng])
        setShowForm(true)
      },
    })
    return null
  }

  const handleFormChange = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }))
    // Clear validation errors when user types
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(e => ({ ...e, [field]: "" }))
    }
  }

  // Validation state
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    address: "",
    power_kw: "",
    price_per_hour: "",
    location: "",
  })
  const [submitError, setSubmitError] = useState("")

  // Validate form
  const validateForm = () => {
    const errors = {
      name: "",
      address: "",
      power_kw: "",
      price_per_hour: "",
      location: "",
    }
    let isValid = true

    if (!form.name.trim()) {
      errors.name = "Station name is required"
      isValid = false
    } else if (form.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters"
      isValid = false
    }

    if (!form.address.trim()) {
      errors.address = "Address is required"
      isValid = false
    } else if (form.address.trim().length < 5) {
      errors.address = "Address must be at least 5 characters"
      isValid = false
    }

    if (form.power_kw <= 0) {
      errors.power_kw = "Power must be greater than 0"
      isValid = false
    } else if (form.power_kw > 500) {
      errors.power_kw = "Power cannot exceed 500 kW"
      isValid = false
    }

    if (form.price_per_hour <= 0) {
      errors.price_per_hour = "Price must be greater than 0"
      isValid = false
    }

    if (!selectedLocation) {
      errors.location = "Please select a location on the map"
      isValid = false
    }

    setValidationErrors(errors)
    return isValid
  }

  const handlePublish = async () => {
    setSubmitError("")
    
    if (!validateForm()) {
      return
    }

    if (!selectedLocation) return

    try {
      const stationRes = await stationAPI.addStation({
        name: form.name.trim(),
        address: form.address.trim(),
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
      setShowForm(false)
      setForm({
        name: "",
        address: "",
        charger_name: "",
        charger_type: chargerTypes[0],
        power_kw: 22,
        price_per_hour: 100,
      })
      setValidationErrors({ name: "", address: "", power_kw: "", price_per_hour: "", location: "" })
      fetchStations()
    } catch (error: any) {
      setSubmitError(error?.response?.data?.detail || error?.message || "Failed to create station")
    }
  }

  // Simulate station stats (in real app, this comes from API)
  const getStationStats = (station: any) => ({
    chargerCount: station.chargers?.length || Math.floor(Math.random() * 5) + 1,
    activeSessions: Math.floor(Math.random() * 3),
    todayRevenue: Math.floor(Math.random() * 5000) + 500,
  })

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#070b10]">
      {/* Sidebar */}
      <div className="w-full md:w-[420px] bg-[#0a1016] border-r border-white/10 z-10 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 space-y-3">
          <button 
            onClick={() => navigate("/admin/dashboard")} 
            className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">Station Management</h1>
              <p className="text-sm text-white/50 mt-1">Click on map to add a new station</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 transition"
            >
              <Plus className="w-4 h-4" /> Add Station
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Station Creation Form */}
          {showForm && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" /> New Station
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setSelectedLocation(null)
                  }}
                  className="text-white/50 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>

              {/* Selected Location */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                  <MapPin className="w-3.5 h-3.5" /> Selected Location
                </div>
                {selectedLocation ? (
                  <p className="text-sm font-mono text-white">
                    {selectedLocation[0].toFixed(5)}, {selectedLocation[1].toFixed(5)}
                  </p>
                ) : (
                  <p className="text-sm text-white/40">Click on map to select</p>
                )}
                {validationErrors.location && (
                  <p className="text-xs text-red-400 mt-2">{validationErrors.location}</p>
                )}
              </div>

              {/* Station Details */}
              <div className="space-y-3">
                <div>
                  <input 
                    className={`w-full px-4 py-3 rounded-xl border bg-black/40 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      validationErrors.name ? "border-red-500/50" : "border-white/10"
                    }`}
                    placeholder="Station Name" 
                    value={form.name} 
                    onChange={e => handleFormChange("name", e.target.value)} 
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-400 mt-1 ml-1">{validationErrors.name}</p>
                  )}
                </div>
                <div>
                  <input 
                    className={`w-full px-4 py-3 rounded-xl border bg-black/40 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      validationErrors.address ? "border-red-500/50" : "border-white/10"
                    }`}
                    placeholder="Address" 
                    value={form.address} 
                    onChange={e => handleFormChange("address", e.target.value)} 
                  />
                  {validationErrors.address && (
                    <p className="text-xs text-red-400 mt-1 ml-1">{validationErrors.address}</p>
                  )}
                </div>
              </div>

              {/* Charger Configuration */}
              <div className="space-y-3">
                <p className="text-xs text-white/50 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Charger Configuration
                </p>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" 
                  value={form.charger_type} 
                  onChange={e => handleFormChange("charger_type", e.target.value)}
                >
                  {chargerTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input 
                      type="number" 
                      className={`w-full px-4 py-3 rounded-xl border bg-black/40 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                        validationErrors.power_kw ? "border-red-500/50" : "border-white/10"
                      }`}
                      placeholder="Power (kW)" 
                      value={form.power_kw} 
                      onChange={e => handleFormChange("power_kw", Number(e.target.value))} 
                    />
                    {validationErrors.power_kw && (
                      <p className="text-xs text-red-400 mt-1 ml-1">{validationErrors.power_kw}</p>
                    )}
                  </div>
                  <div>
                    <input 
                      type="number" 
                      className={`w-full px-4 py-3 rounded-xl border bg-black/40 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                        validationErrors.price_per_hour ? "border-red-500/50" : "border-white/10"
                      }`}
                      placeholder="₹/hour" 
                      value={form.price_per_hour} 
                      onChange={e => handleFormChange("price_per_hour", Number(e.target.value))} 
                    />
                    {validationErrors.price_per_hour && (
                      <p className="text-xs text-red-400 mt-1 ml-1">{validationErrors.price_per_hour}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-400">{submitError}</p>
                </div>
              )}

              <button 
                onClick={handlePublish} 
                className="w-full py-3 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition"
              >
                Publish Station
              </button>
            </div>
          )}

          {/* Existing Stations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Your Stations
              </h2>
              <span className="text-xs text-white/40">{stations.length} stations</span>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-white/50">Loading stations…</p>
              </div>
            ) : stations.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border border-white/5 bg-white/[0.02]">
                <Building2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/50">No stations created yet</p>
                <p className="text-xs text-white/30 mt-1">Click on the map to add your first station</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stations.map((station: any) => {
                  const stats = getStationStats(station)
                  return (
                    <div 
                      key={station.id} 
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition cursor-pointer group"
                      onClick={() => {
                        // Navigate to station detail or expand
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-emerald-300 transition">
                            {station.name}
                          </h3>
                          <p className="text-xs text-white/50 mt-0.5">{station.address}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition" />
                      </div>

                      {/* Station Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-black/40 border border-white/5 p-2.5">
                          <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                            <Zap className="w-3 h-3" /> Chargers
                          </div>
                          <p className="text-sm font-semibold text-white">{stats.chargerCount}</p>
                        </div>
                        <div className="rounded-xl bg-black/40 border border-white/5 p-2.5">
                          <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                            <Activity className="w-3 h-3" /> Active
                          </div>
                          <p className="text-sm font-semibold text-emerald-400">{stats.activeSessions}</p>
                        </div>
                        <div className="rounded-xl bg-black/40 border border-white/5 p-2.5">
                          <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                            <IndianRupee className="w-3 h-3" /> Today
                          </div>
                          <p className="text-sm font-semibold text-white">₹{stats.todayRevenue}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={[28.6139, 77.209]} zoom={13} className="h-full w-full">
          <TileLayer 
            attribution="© OpenStreetMap contributors" 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          />
          <MapClickHandler />
          {stations.map((station: any) => (
            <Marker key={station.id} position={[Number(station.latitude), Number(station.longitude)]} />
          ))}
          {selectedLocation && <Marker position={selectedLocation} />}
        </MapContainer>
        
        {/* Map Instructions Overlay */}
        {!selectedLocation && !showForm && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-black/80 border border-white/10 backdrop-blur-sm">
            <p className="text-sm text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> Click on the map to select a location
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminStationPage