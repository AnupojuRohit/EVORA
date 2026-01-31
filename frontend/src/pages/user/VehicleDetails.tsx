import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { carAPI } from "../../lib/api"
import { ArrowLeft, BatteryCharging, MapPin, Zap } from "lucide-react"

export default function VehicleDetails() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<any>(null)

  useEffect(() => {
    carAPI.getCars().then(res => {
      const v = res.data.find((x: any) => x.id === vehicleId)
      if (!v) navigate("/user/vehicles")
      setVehicle(v)
    })
  }, [vehicleId])

  if (!vehicle) return null

  return (
    <DashboardLayout userType="user">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Vehicles
        </button>

        {/* HERO */}
        <div className="
          rounded-3xl p-8
          bg-gradient-to-br from-[#141628] to-[#0b0d1a]
          border border-white/10
          grid grid-cols-1 md:grid-cols-2 gap-10
        ">
          {/* INFO */}
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold">
              {vehicle.brand} {vehicle.model}
            </h1>

            <p className="text-white/60">{vehicle.car_number}</p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Stat icon={BatteryCharging} label="Battery" value="78%" />
              <Stat icon={Zap} label="Range" value="312 km" />
              <Stat icon={MapPin} label="Purchased" value="12 Jan 2024" />
            </div>
          </div>

          {/* IMAGE */}
          <div className="rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1619767886558-efdc259cde1a"
              alt="EV"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* EXTRA INFO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Info title="Charger Type" value={vehicle.charger_type} />
          <Info title="Total Sessions" value="24" />
          <Info title="Total Energy Used" value="186 kWh" />
        </div>
      </div>
    </DashboardLayout>
  )
}

const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-3 text-sm">
    <Icon className="w-5 h-5 text-emerald-400" />
    <span className="text-white/60">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
)

const Info = ({ title, value }: any) => (
  <div className="
    rounded-2xl p-6
    bg-white/5 border border-white/10
  ">
    <p className="text-xs text-white/50">{title}</p>
    <p className="mt-1 text-lg font-semibold">{value}</p>
  </div>
)
