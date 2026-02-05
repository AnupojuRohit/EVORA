import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Zap, 
  Calendar, 
  TrendingUp,
  Settings,
  Clock,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AddStationModal from '../../components/modals/AddStationModal';
import AddChargerModal from '../../components/modals/AddChargerModal';
import AddSlotModal from '../../components/modals/AddSlotModal';
import { stationAPI, slotAPI } from '../../lib/api';

interface Station {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  supported_charger_types?: string[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [showAddChargerModal, setShowAddChargerModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [availableCounts, setAvailableCounts] = useState<Record<string, number>>({});

  const stats = {
    totalStations: stations.length,
    availableSlots: Object.values(availableCounts).reduce((a, b) => a + b, 0),
  };

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    const run = async () => {
      const entries = await Promise.all(
        stations.map(async (s) => {
          try {
            const res = await slotAPI.getAvailableCount(s.id);
            return [s.id, res.data.available_slots as number] as const;
          } catch {
            return [s.id, 0] as const;
          }
        })
      );
      setAvailableCounts(Object.fromEntries(entries));
    };
    if (stations.length) run();
  }, [stations]);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const response = await stationAPI.getStations();
      setStations(response.data);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCharger = (stationId: string) => {
    setSelectedStationId(stationId);
    setShowAddChargerModal(true);
  };

  const handleAddSlot = (stationId: string) => {
    setSelectedStationId(stationId);
    setShowAddSlotModal(true);
  };

  return (
    <DashboardLayout userType="admin" userName="Admin User">
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your charging stations and monitor performance</p>
          </div>
          <button onClick={() => setShowAddStationModal(true)} className="btn-primary">Add Station</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={MapPin} label="Total Stations" value={stats.totalStations} />
          <StatCard icon={Zap} label="Available Slots (All)" value={stats.availableSlots} />
          <StatCard icon={Calendar} label="Today's Bookings" value={0} />
          <StatCard icon={TrendingUp} label="Today's Revenue" value={undefined} />
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-foreground">Station Management</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : stations.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">No stations available.</div>
          ) : (
            <div className="space-y-4">
              {stations.map((station) => (
                <div key={station.id} className="p-5 rounded-xl bg-muted/30 border border-border hover:shadow-soft transition-all duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
                        <MapPin className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg">{station.name}</h3>
                        <p className="text-sm text-muted-foreground">{station.address}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Layers className="w-4 h-4 text-primary" />
                            {(station.supported_charger_types?.length ?? 0)} types
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 text-primary" />
                            {availableCounts[station.id] ?? 0} available slots
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-16 lg:pl-0">
                      <button onClick={() => handleAddCharger(station.id)} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Add Charger
                      </button>
                      <button onClick={() => handleAddSlot(station.id)} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Add Slot
                      </button>
                      <button className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2" onClick={() => navigate(`/admin/stations/${station.id}/manage`)}>
                        <Settings className="w-4 h-4" /> Manage
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddStationModal isOpen={showAddStationModal} onClose={() => setShowAddStationModal(false)} onSuccess={fetchStations} />
      <AddChargerModal isOpen={showAddChargerModal} onClose={() => setShowAddChargerModal(false)} stationId={selectedStationId} onSuccess={fetchStations} />
      <AddSlotModal isOpen={showAddSlotModal} onClose={() => setShowAddSlotModal(false)} stationId={selectedStationId} onSuccess={fetchStations} />
    </DashboardLayout>
  );
};

export default AdminDashboard;