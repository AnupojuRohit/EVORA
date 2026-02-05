
import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  Gauge,
  Info,
  Leaf,
  MapPin,
  Navigation2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Timer,
  X,
  Zap,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { carAPI, stationAPI } from "@/lib/api"
import L from "leaflet"
import { AnimatePresence, motion } from "framer-motion"

interface Vehicle {
  id: string
  brand: string
  model: string
  car_number: string
  charger_type: string
}

interface Station {
  id: string
  name: string
  address: string
  latitude: string
  longitude: string
  supported_charger_types: string[]
  distance_km?: number
}

const userLocationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "user-location-marker",
})

const BookingPage = () => {
  const navigate = useNavigate()

  const [stations, setStations] = useState<Station[]>([])
  const [filteredStations, setFilteredStations] = useState<Station[]>([])
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  const [availableSlots, setAvailableSlots] = useState<number | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [search, setSearch] = useState("")
  const [sortByDistance, setSortByDistance] = useState(true)
  const [countdown, setCountdown] = useState(45 * 60 + 18)
  const [co2Saved, setCo2Saved] = useState(0)
  const [sessionsCount, setSessionsCount] = useState(0)
  const stationSectionRef = useRef<HTMLDivElement | null>(null)

  // Check for penalty flag
  const hasPenalty = localStorage.getItem("evora_penalty") === "true"

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude])
      },
      (err) => {
        console.error("Location error:", err)
        setUserLocation([17.48, 78.52]) // fallback (Hyderabad)
      }
    )
  }, [])

  useEffect(() => {
    if (!userLocation) return

    const fetchNearbyStations = async () => {
      try {
        const [lat, lng] = userLocation
        const res = await stationAPI.getNearbyStations(lat, lng)
        setStations(res.data)
        setFilteredStations(res.data)
      } catch (err) {
        console.error("Failed to fetch nearby stations", err)
      }
    }

    fetchNearbyStations()
  }, [userLocation])

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await carAPI.getCars()
        setVehicles(res.data)
      } catch (err) {
        console.error("Failed to load vehicles", err)
      }
    }
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (!selectedStation) return

    const fetchAvailability = async () => {
      setLoadingSlots(true)
      try {
        const res = await stationAPI.getAvailability(selectedStation.id)
        setAvailableSlots(res.data.available_slots)
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchAvailability()
  }, [selectedStation])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const targetCO2 = 128.4
    const targetSessions = 42
    const duration = 1200
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setCo2Saved(Number((targetCO2 * progress).toFixed(1)))
      setSessionsCount(Math.floor(targetSessions * progress))
      if (progress < 1) requestAnimationFrame(tick)
    }

    const frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const filterStationsByVehicle = (vehicle: Vehicle) => {
    const compatible = stations.filter(station =>
      station.supported_charger_types.includes(vehicle.charger_type)
    )
    setFilteredStations(compatible)
  }

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    filterStationsByVehicle(vehicle)
    setSelectedStation(null) // Reset station selection when vehicle changes
    setAvailableSlots(null)
  }

  const displayStations = filteredStations
    .filter(station => {
      const term = search.trim().toLowerCase()
      if (!term) return true
      return (
        station.name.toLowerCase().includes(term) ||
        station.address.toLowerCase().includes(term)
      )
    })
    .sort((a, b) => {
      if (!sortByDistance) return 0
      const da = a.distance_km ?? Number.POSITIVE_INFINITY
      const db = b.distance_km ?? Number.POSITIVE_INFINITY
      return da - db
    })

  const bookingState = useMemo(() => {
    if (loadingSlots) {
      return {
        key: "loading",
        title: "Checking availability",
        description: "Scanning nearby chargers for real-time slot updates.",
        cta: "Book a Slot",
        tone: "from-cyan-500/20 via-emerald-500/10 to-emerald-400/20",
        progress: 42,
      }
    }
    if (selectedStation && availableSlots && availableSlots > 0) {
      return {
        key: "upcoming",
        title: "Upcoming charging",
        description: "Slot reserved. Arrive 10 minutes early for smooth check-in.",
        cta: "Book a Slot",
        tone: "from-emerald-500/20 via-cyan-500/10 to-emerald-400/20",
        progress: 72,
      }
    }
    if (selectedStation && availableSlots === 0) {
      return {
        key: "unavailable",
        title: "No slots available",
        description: "All chargers are currently busy. Try a different station.",
        cta: "Book a Slot",
        tone: "from-rose-500/10 via-orange-400/5 to-emerald-400/10",
        progress: 18,
      }
    }
    return {
      key: "idle",
      title: "No booking yet",
      description: "Choose a vehicle and station to secure your charging slot.",
      cta: "Book a Slot",
      tone: "from-emerald-500/10 via-cyan-500/5 to-emerald-400/10",
      progress: 28,
    }
  }, [availableSlots, loadingSlots, selectedStation])

  const formatCountdown = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return [hrs, mins, secs].map(v => String(v).padStart(2, "0"))
  }

  const [hrs, mins, secs] = formatCountdown(countdown)
  const ringRadius = 44
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (bookingState.progress / 100) * ringCircumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-[#070b10] text-slate-100"
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_42%),radial-gradient(circle_at_25%_20%,_rgba(34,211,238,0.12),_transparent_45%)]" />
        <div className="relative p-6 lg:p-10 space-y-6">
          {/* Penalty Warning Banner */}
          {hasPenalty && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-200">Penalty Notice</p>
                  <p className="text-xs text-amber-300/70 mt-1">
                    Your previous slot was missed. A penalty may be applied to this booking.
                    Please ensure you arrive on time to avoid future penalties.
                  </p>
                </div>
                <button
                  onClick={() => localStorage.removeItem("evora_penalty")}
                  className="ml-auto text-amber-400/60 hover:text-amber-300 transition"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 rounded-full px-2 py-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">EV Stations</p>
              <h1 className="text-3xl font-semibold tracking-tight">Booking Dashboard</h1>
              <p className="text-sm text-slate-400 mt-2 max-w-xl">
                Real-time station intelligence and booking orchestration for premium EV charging.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center gap-2 h-11 w-72 rounded-full bg-white/5 border border-white/10 px-4 text-sm text-slate-200 focus-within:border-emerald-300/60 focus-within:ring-2 focus-within:ring-emerald-300/20 transition">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search stations"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setSortByDistance(v => !v)}
                className={`h-11 w-11 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 ${
                  sortByDistance ? "border-emerald-300/40 bg-emerald-400/10" : "border-white/10 bg-white/5"
                }`}
                title="Sort by distance"
                aria-pressed={sortByDistance}
              >
                <SlidersHorizontal className="w-4 h-4 mx-auto text-slate-200" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 space-y-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br p-6 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl"
              >
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${bookingState.tone} opacity-60`} />
                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      Premium booking status
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight">{bookingState.title}</h2>
                    <p className="text-sm text-slate-300 max-w-md">{bookingState.description}</p>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => stationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_10px_30px_-15px_rgba(52,211,153,0.8)] hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/60"
                    >
                      <Zap className="w-4 h-4" />
                      {bookingState.cta}
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <svg width="112" height="112" className="rotate-[-90deg]">
                        <circle
                          cx="56"
                          cy="56"
                          r={ringRadius}
                          stroke="rgba(148,163,184,0.2)"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="56"
                          cy="56"
                          r={ringRadius}
                          stroke="url(#ringGradient)"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringOffset}
                          strokeLinecap="round"
                          initial={{ strokeDashoffset: ringCircumference }}
                          animate={{ strokeDashoffset: ringOffset }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                        <defs>
                          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#22d3ee" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-semibold">{bookingState.progress}%</span>
                        <span className="text-xs text-slate-400">Energy sync</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Activity className="w-4 h-4 text-cyan-300" />
                        Grid load: Optimal
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Gauge className="w-4 h-4 text-emerald-300" />
                        Avg. wait: 8 min
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        Priority support: Enabled
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_60px_-40px_rgba(15,23,42,0.8)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <CalendarClock className="w-4 h-4 text-emerald-300" />
                      Booking / Charging
                    </div>
                    <span className="text-xs text-slate-500">Auto-updating</span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs text-slate-400">Station</p>
                      <p className="text-lg font-semibold">
                        {selectedStation ? selectedStation.name : "Select a station"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedStation ? selectedStation.address : "Your booking destination will appear here."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-emerald-300" />
                        DC Fast 60kW
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        <Timer className="w-3.5 h-3.5 text-cyan-300" />
                        Arrival ETA 12m
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                      <p className="text-xs text-slate-500 mb-2">Countdown to slot release</p>
                      <div className="flex items-center gap-2 text-2xl font-semibold tracking-[0.2em]">
                        <AnimatePresence mode="popLayout">
                          {[hrs, mins, secs].map((value, index) => (
                            <motion.span
                              key={`${value}-${index}`}
                              initial={{ y: 12, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -12, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-emerald-300"
                            >
                              {value}
                              {index < 2 ? ":" : ""}
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_10px_30px_-15px_rgba(52,211,153,0.7)]"
                      >
                        <Navigation2 className="w-4 h-4" />
                        Navigate
                      </motion.button>
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reschedule
                      </motion.button>
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_60px_-40px_rgba(15,23,42,0.8)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Car className="w-4 h-4 text-emerald-300" />
                      Selected Vehicle
                    </div>
                    <button
                      onClick={() => navigate("/dashboard/vehicles")}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <img src="/car.jpg" alt="EV" className="w-28 h-20 object-cover rounded-2xl" />
                    <div>
                      <p className="text-xs text-slate-400">EV</p>
                      <h3 className="text-lg font-semibold">
                        {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Tesla M2"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedVehicle ? selectedVehicle.car_number : "MH-12-AB-4576"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500">Charger type</p>
                      <p className="font-semibold text-emerald-300">
                        {selectedVehicle?.charger_type || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Vehicles on file</p>
                      <p className="font-semibold">{vehicles.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Compatible stations</p>
                      <p className="font-semibold">{filteredStations.length}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-emerald-300" />
                      Your area
                    </div>
                    <div className="text-xs text-slate-500">Live Map</div>
                  </div>

                  <div className="h-[260px] rounded-2xl overflow-hidden border border-white/10">
                    {userLocation ? (
                      <MapContainer center={userLocation} zoom={13} className="h-full w-full">
                        <TileLayer
                          attribution="© OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={userLocation} icon={userLocationIcon} />
                        {displayStations.map(station => (
                          <Marker
                            key={station.id}
                            position={[Number(station.latitude), Number(station.longitude)]}
                            eventHandlers={{
                              click: () => setSelectedStation(station),
                            }}
                          />
                        ))}
                      </MapContainer>
                    ) : (
                      <div className="h-full w-full animate-pulse bg-gradient-to-br from-white/5 to-white/10" />
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl" ref={stationSectionRef}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-300" />
                      <h3 className="text-sm font-semibold">Nearby Stations</h3>
                    </div>
                    <div className="text-xs text-slate-500">{displayStations.length} results</div>
                  </div>

                  {!selectedVehicle && (
                    <p className="text-xs text-slate-400 mb-3">Select a vehicle to filter compatible stations.</p>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {displayStations.slice(0, 4).map((station) => (
                      <motion.button
                        key={station.id}
                        whileHover={{ y: -2 }}
                        transition={{ type: "spring", stiffness: 200, damping: 18 }}
                        onClick={() => setSelectedStation(station)}
                        className={`text-left rounded-2xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/30 ${
                          selectedStation?.id === station.id
                            ? "border-emerald-400/40 bg-emerald-400/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-300">
                            <Zap className="w-4 h-4" />
                            <span className="text-xs">
                              {station.distance_km ? `${station.distance_km} miles` : "2.1 miles"}
                            </span>
                          </div>
                          <div className="h-7 w-7 rounded-lg border border-white/10 bg-white/10 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-slate-200" />
                          </div>
                        </div>

                        <h4 className="mt-3 font-semibold text-sm text-white">{station.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{station.address}</p>

                        <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
                          <div>
                            <p className="text-slate-500">Type</p>
                            <p className="font-medium">{station.supported_charger_types?.[0] || "—"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Price</p>
                            <p className="font-medium">
                              {typeof (station as any).price_per_kwh === "number"
                                ? `₹${(station as any).price_per_kwh}/kWh`
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Availability</p>
                            <p className="font-medium">
                              {typeof (station as any).available_slots === "number"
                                ? `${(station as any).available_slots} slots`
                                : "Unknown"}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Car className="w-4 h-4 text-emerald-300" />
                  <h3 className="text-sm font-semibold">Select Your Vehicle</h3>
                </div>

                {vehicles.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-sm mb-3">No vehicles found.</p>
                    <button
                      onClick={() => navigate("/dashboard/vehicles")}
                      className="px-4 py-2 rounded-full bg-emerald-400 text-slate-900 text-sm font-semibold"
                    >
                      Add Vehicle
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {vehicles.map(vehicle => (
                      <motion.button
                        key={vehicle.id}
                        whileHover={{ y: -2 }}
                        transition={{ type: "spring", stiffness: 200, damping: 18 }}
                        onClick={() => handleVehicleSelect(vehicle)}
                        className={`text-left p-4 rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/30 ${
                          selectedVehicle?.id === vehicle.id
                            ? "border-emerald-400/40 bg-emerald-400/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src="/car.jpg"
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-medium text-sm text-white">{vehicle.brand} {vehicle.model}</p>
                            <p className="text-xs text-slate-400">{vehicle.car_number}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Bell className="w-4 h-4 text-emerald-300" />
                    Notifications
                  </div>
                  <span className="text-xs text-slate-500">Live updates</span>
                </div>

                <div className="mt-4 space-y-3">
                  <AnimatePresence>
                    {[
                      { id: "notif-1", title: "Charger allocated", time: "Just now", unread: true },
                      { id: "notif-2", title: "Station capacity at 72%", time: "5m ago", unread: true },
                      { id: "notif-3", title: "CO₂ savings milestone unlocked", time: "2h ago", unread: false },
                    ].map(note => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-2xl border px-4 py-3 ${
                          note.unread
                            ? "border-emerald-400/30 bg-emerald-400/10"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            note.unread ? "bg-emerald-400/20 text-emerald-200" : "bg-white/5 text-slate-300"
                          }`}>
                            <Info className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{note.title}</p>
                            <p className="text-xs text-slate-400 mt-1">{note.time}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Leaf className="w-4 h-4 text-emerald-300" />
                    Eco Impact
                  </div>
                  <span className="text-xs text-slate-500">Monthly</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-slate-500">CO₂ saved</p>
                    <p className="text-2xl font-semibold text-emerald-300 mt-2">{co2Saved} kg</p>
                    <p className="text-xs text-slate-500 mt-2">Equivalent to 320 km</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-slate-500">Sessions</p>
                    <p className="text-2xl font-semibold text-cyan-300 mt-2">{sessionsCount}</p>
                    <p className="text-xs text-slate-500 mt-2">+12% vs last month</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Activity className="w-4 h-4 text-emerald-300" />
                    Emissions tracking updated in real-time based on grid mix.
                  </div>
                  <div className="mt-3 h-12 rounded-2xl bg-gradient-to-r from-emerald-400/30 via-cyan-400/20 to-emerald-300/30" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Booking Summary</h3>
                  <span className="text-xs text-slate-500">Auto-sync</span>
                </div>

                <div className="space-y-4 text-sm mt-4">
                  <div className="flex items-center gap-3">
                    <Car className="w-4 h-4 text-emerald-300" />
                    <div>
                      <p className="text-xs text-slate-500">Vehicle</p>
                      <p className="font-medium">
                        {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Not selected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-300" />
                    <div>
                      <p className="text-xs text-slate-500">Station</p>
                      <p className="font-medium">
                        {selectedStation ? selectedStation.name : "Not selected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-300" />
                    <div>
                      <p className="text-xs text-slate-500">Availability</p>
                      <p className="font-medium">
                        {selectedStation ? (
                          loadingSlots ? "Checking..." :
                          availableSlots === 0 ? "No slots available" :
                          `${availableSlots} slots available`
                        ) : "Select station first"}
                      </p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!selectedStation || availableSlots === 0}
                  onClick={() => {
                    if (!selectedStation || !selectedVehicle) return
                    navigate(`/booking/${selectedStation.id}/slots`, {
                      state: { station: selectedStation, vehicle: selectedVehicle },
                    })
                  }}
                  className={`w-full mt-5 py-3 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 ${
                    !selectedStation || availableSlots === 0
                      ? "bg-white/5 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-400 text-slate-900 hover:bg-emerald-300"
                  }`}
                >
                  Proceed to Slot Selection
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BookingPage
