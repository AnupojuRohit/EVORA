import { useState, useEffect } from 'react';
import { stationAPI, carAPI, bookingAPI } from '../../lib/api';
import { Calendar, Car, MapPin, Battery, Receipt } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';

interface NearbyStation { id: string; name: string; address: string; latitude: string; longitude: string; distance_km: number; }
interface Booking { id: string; order_id: string; transaction_id: string; ticket_id: string; amount: number; status: string; created_at: string; }

const UserDashboard = () => {
  const [nearbyStations, setNearbyStations] = useState<NearbyStation[]>([]);
  const [loadingNearbyStations, setLoadingNearbyStations] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchNearbyStations = async () => {
      try {
        let lat = 17.48; let lng = 78.52;
        if (navigator.geolocation) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
              () => resolve(),
              { timeout: 3000 }
            );
          });
        }
        const res = await stationAPI.getNearbyStations(lat, lng);
        setNearbyStations(res.data);
      } catch (error) {
        setNearbyStations([]);
      } finally {
        setLoadingNearbyStations(false);
      }
    };
    fetchNearbyStations();
  }, []);

  useEffect(() => {
    (async () => {
      try { const res = await carAPI.getCars(); setVehicles(res.data); } catch {}
      try { const resB = await bookingAPI.getMyBookings(); setRecentTx(resB.data.slice(0, 2)); } catch {}
    })();
  }, []);

  const stats = { activeBookings: 0, totalCharges: 0, savedStations: 0 };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Active Bookings" value={stats.activeBookings} />
        <StatCard icon={Battery} label="Total Charges" value={stats.totalCharges} />
        <StatCard icon={Car} label="My Vehicles" value={vehicles.length} />
        <StatCard icon={MapPin} label="Saved Stations" value={stats.savedStations} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6"><h2 className="font-display font-semibold text-lg text-foreground">My Vehicles</h2></div>
          {vehicles.length === 0 ? (
            <EmptyState icon={Car} title="No vehicles added" description="Add vehicles from the My Vehicles page." />
          ) : (
            <div className="space-y-3">
              {vehicles.map((v) => (
                <div key={v.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center"><Car className="w-6 h-6 text-primary" /></div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-foreground">{v.brand} {v.model}</p><p className="mt-1 text-sm font-mono tracking-wider text-muted-foreground">{v.car_number}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-elevated p-6">
          <h2 className="font-display font-semibold text-lg text-foreground mb-6">Nearby Stations</h2>
          {loadingNearbyStations ? (
            <p className="text-muted-foreground">Finding nearby stations...</p>
          ) : nearbyStations.length === 0 ? (
            <p className="text-muted-foreground">No stations found nearby.</p>
          ) : (
            <div className="space-y-3">
              {nearbyStations.map((station) => (
                <div key={station.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div><p className="font-medium text-foreground">{station.name}</p><p className="text-sm text-muted-foreground">{station.address}</p></div>
                  <div className="text-sm font-medium text-emerald-600">{station.distance_km} km</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-elevated p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4"><Receipt className="w-5 h-5 text-primary" /><h3 className="font-display font-semibold text-lg text-foreground">Recent Transactions</h3></div>
          {recentTx.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent transactions.</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm"><span className="font-mono">{tx.order_id}</span> • <span className="font-mono">{tx.transaction_id}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-sm font-medium">₹{tx.amount}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
