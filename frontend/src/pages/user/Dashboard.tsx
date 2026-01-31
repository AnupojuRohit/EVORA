import { useEffect, useState } from "react"
import AppleStat from "./AppleStat"
import Row from "./Row"
import VehicleHeroCard from "./VehicleHeroCard"
import { carAPI, stationAPI, bookingAPI } from "../../lib/api"

const Dashboard = () => {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [tx, setTx] = useState<any[]>([])

  useEffect(() => {
    carAPI.getCars().then(r => setVehicles(r.data))
    stationAPI.getNearbyStations(17.48, 78.52).then(r => setStations(r.data))
    bookingAPI.getMyBookings().then(r => setTx(r.data.slice(0, 3)))
  }, [])

  return (
    <div className="p-10 space-y-12 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        <div className="animate-fade-up">
          <h1 className="text-4xl font-bold tracking-tight animate-neon bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-white/70 text-lg mt-2">EV ecosystem overview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 animate-delay-1">
          <div className="animate-slide-in-left">
            <AppleStat title="Active Bookings" value="0" />
          </div>
          <div className="animate-slide-in-left animate-delay-1">
            <AppleStat title="Total Charges" value="0" />
          </div>
          <div className="animate-slide-in-right animate-delay-2">
            <AppleStat title="My Vehicles" value={vehicles.length} />
          </div>
          <div className="animate-slide-in-right animate-delay-3">
            <AppleStat title="Saved Stations" value="0" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 animate-delay-2">
          <div className="xl:col-span-2 animate-fade-up animate-delay-4">
            {vehicles.length > 0 && <VehicleHeroCard vehicle={vehicles[0]} />}
          </div>

          <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6 animate-slide-in-right animate-delay-3">
            <h3 className="font-semibold mb-4 text-lg">Nearby Stations</h3>
            <div className="space-y-3">
              {stations.slice(0, 3).map((s, index) => (
                <div key={s.id} className={`animate-fade-up`} style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
                  <Row
                    title={s.name}
                    subtitle={s.address}
                    right={`${s.distance_km} km`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6 animate-fade-up animate-delay-4">
          <h3 className="font-semibold mb-4 text-lg">Recent Transactions</h3>
          <div className="space-y-3">
            {tx.slice(0, 3).map((t, index) => (
              <div key={t.id} className={`animate-fade-up`} style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                <Row
                  title={`${t.order_id} · ${t.transaction_id}`}
                  subtitle={new Date(t.created_at).toLocaleString()}
                  right={`₹${t.amount}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
