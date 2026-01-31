
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Car, MapPin, Clock, Zap, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { carAPI, stationAPI } from "@/lib/api"
import L from "leaflet"

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
  const [tempVehicle, setTempVehicle] = useState<Vehicle | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)

  const [availableSlots, setAvailableSlots] = useState<number | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

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

  return (
    <div className="min-h-screen bg-ambient text-white overflow-hidden">
      <div className="p-10 space-y-8 relative">

        {/* Ambient Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="animate-fade-up">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold tracking-tight animate-neon bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Book Charging Slot
            </h1>
            <p className="text-white/70 text-lg mt-2">Select your vehicle and find available charging stations</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* LEFT COLUMN - Vehicle & Station Selection */}
          <div className="xl:col-span-2 space-y-8">

            {/* VEHICLE SELECTION */}
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Car className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl font-semibold">Select Your Vehicle</h3>
              </div>

              {vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/50 mb-4">No vehicles found. Add a vehicle first.</p>
                  <button
                    onClick={() => navigate("/dashboard/vehicles")}
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition"
                  >
                    Add Vehicle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map(vehicle => (
                    <div
                      key={vehicle.id}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        selectedVehicle?.id === vehicle.id
                          ? "border-emerald-400 bg-emerald-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src="/car.jpg"
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-lg">{vehicle.brand} {vehicle.model}</h4>
                          <p className="text-white/60 text-sm">{vehicle.car_number}</p>
                          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                            {vehicle.charger_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STATION SELECTION */}
            {selectedVehicle && (
              <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xl font-semibold">Select Charging Station</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStations.map(station => (
                    <div
                      key={station.id}
                      onClick={() => setSelectedStation(station)}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        selectedStation?.id === station.id
                          ? "border-emerald-400 bg-emerald-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <h4 className="font-semibold text-lg mb-2">{station.name}</h4>
                      <p className="text-white/60 text-sm mb-3">{station.address}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {station.supported_charger_types.map(type => (
                          <span key={type} className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                      {station.distance_km && (
                        <p className="text-emerald-400 text-sm font-medium">{station.distance_km} km away</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN - Map & Summary */}
          <div className="space-y-8">

            {/* MAP */}
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6">
              <h3 className="text-xl font-semibold mb-4">Station Map</h3>
              <div className="h-80 rounded-2xl overflow-hidden">
                {userLocation && (
                  <MapContainer
                    center={userLocation}
                    zoom={13}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution="© OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={userLocation} icon={userLocationIcon} />
                    {filteredStations.map(station => (
                      <Marker
                        key={station.id}
                        position={[Number(station.latitude), Number(station.longitude)]}
                        eventHandlers={{
                          click: () => setSelectedStation(station),
                        }}
                      />
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>

            {/* BOOKING SUMMARY */}
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6">
              <h3 className="text-xl font-semibold mb-6">Booking Summary</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm text-white/50">Vehicle</p>
                    <p className="font-medium">
                      {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Not selected"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm text-white/50">Station</p>
                    <p className="font-medium">
                      {selectedStation ? selectedStation.name : "Not selected"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm text-white/50">Availability</p>
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

              <button
                disabled={!selectedStation || availableSlots === 0}
                onClick={() => {
                  if (!selectedStation || !selectedVehicle) return
                  navigate(`/booking/${selectedStation.id}/slots`, {
                    state: { station: selectedStation, vehicle: selectedVehicle },
                  })
                }}
                className={`w-full mt-6 py-4 rounded-2xl font-semibold transition-all duration-200 ${
                  !selectedStation || availableSlots === 0
                    ? "bg-white/10 text-white/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-400 to-teal-400 text-black hover:opacity-90"
                }`}
              >
                Proceed to Slot Selection
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default BookingPage
