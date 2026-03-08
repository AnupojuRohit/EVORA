import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminDashboardLayout from "@/components/layout/AdminDashboardLayout";
import { Trash2, Zap, Clock, ArrowLeft } from "lucide-react";
import { stationAPI, chargerAPI, slotAPI } from "@/lib/api";

const oneHourSlots = Array.from({ length: 11 }, (_, i) => {
  const start = 8 + i;
  const end = start + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { start: `${pad(start)}:00`, end: `${pad(end)}:00` };
});

const StationManage = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const [station, setStation] = useState<any>(null);
  const [chargers, setChargers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCharger, setNewCharger] = useState({
    charger_type: "CCS2",
    power_kw: 22,
    price_per_hour: 100,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!stationId) return;
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        stationAPI.getStationById(stationId),
        stationAPI.getChargersWithSlots(stationId),
      ]);
      setStation(s.data);
      setChargers(c.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [stationId]);

  const addCharger = async () => {
    if (!stationId) return;
    await chargerAPI.addCharger(stationId, newCharger as any);
    setShowAdd(false);
    setNewCharger({ charger_type: "CCS2", power_kw: 22, price_per_hour: 100 });
    await load();
  };

  const toggleSlot = async (chargerId: string, start: string, end: string, enabled: boolean) => {
    if (!stationId) return;
    setBusy(`${chargerId}-${start}-${end}`);
    try {
      if (enabled) {
        // already exists; nothing to do in current backend as no DELETE endpoint
        // skip to avoid duplicate creation
      } else {
        // create slot
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        await slotAPI.addSlot(stationId, {
          charger_id: chargerId,
          start_time: `${yyyy}-${mm}-${dd}T${start}:00`,
          end_time: `${yyyy}-${mm}-${dd}T${end}:00`,
        });
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminDashboardLayout userName="Admin User">
      <div className="space-y-6 max-w-6xl p-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Station</h1>
            <p className="text-sm text-white/50">Station ID: {stationId}</p>
          </div>
          <button onClick={() => navigate(-1)} className="text-sm text-white/70 hover:text-white">
            <ArrowLeft className="inline w-4 h-4 mr-1" /> Back
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !station ? (
          <p className="text-sm text-muted-foreground">Not found</p>
        ) : (
          <>
            <div className="card-elevated p-5 space-y-4">
              <p className="font-medium">{station.name}</p>
              <p className="text-sm text-muted-foreground">{station.address}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input" value={station.name} onChange={e => setStation({ ...station, name: e.target.value })} placeholder="Name" />
                <input className="input" value={station.address} onChange={e => setStation({ ...station, address: e.target.value })} placeholder="Address" />
                <input className="input" value={station.latitude} onChange={e => setStation({ ...station, latitude: e.target.value })} placeholder="Latitude" />
                <input className="input" value={station.longitude} onChange={e => setStation({ ...station, longitude: e.target.value })} placeholder="Longitude" />
              </div>
              <div className="flex justify-end">
                <button className="btn-primary" onClick={async () => { await stationAPI.updateStation(stationId!, station); await load(); }}>Save Changes</button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Chargers</h2>
              <button className="btn-secondary" onClick={() => setShowAdd(v => !v)}>
                {showAdd ? 'Cancel' : 'Add Charger'}
              </button>
            </div>

            {showAdd && (
              <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                <select className="input" value={newCharger.charger_type} onChange={e => setNewCharger(c => ({ ...c, charger_type: e.target.value }))}>
                  {['Type 1','Type 2','CCS2','CHAdeMO','GB/T'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input className="input" type="number" placeholder="Power (kW)" value={newCharger.power_kw} onChange={e => setNewCharger(c => ({ ...c, power_kw: Number(e.target.value) }))} />
                <input className="input" type="number" placeholder="Price per hour" value={newCharger.price_per_hour} onChange={e => setNewCharger(c => ({ ...c, price_per_hour: Number(e.target.value) }))} />
                <button className="btn-primary w-full" onClick={addCharger}>Create Charger</button>
              </div>
            )}

            <div className="space-y-4">
              {chargers.map((charger) => {
                const slotSet = new Set(
                  (charger.slots || []).map((s: any) => `${String(new Date(s.start_time).getHours()).padStart(2, '0')}:00-${String(new Date(s.end_time).getHours()).padStart(2, '0')}:00`)
                );
                return (
                  <div key={charger.id} className="card-elevated p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{charger.name || charger.charger_type}</p>
                          <p className="text-sm text-muted-foreground">{charger.power_kw} kW • ₹{charger.price_per_hour}/hr</p>
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-700" onClick={async () => { if (!confirm('Delete this charger?')) return; await chargerAPI.deleteCharger(charger.id); await load(); }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {oneHourSlots.map(({ start, end }) => {
                        const key = `${start}-${end}`;
                        const enabled = slotSet.has(key);
                        return (
                          <button
                            key={key}
                            disabled={busy === `${charger.id}-${key}`}
                            onClick={() => toggleSlot(charger.id, start, end, enabled)}
                            className={`text-xs py-2 rounded-lg font-medium transition ${enabled ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'} ${busy === `${charger.id}-${key}` ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={`${start} – ${end}`}
                          >
                            {start}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default StationManage;
