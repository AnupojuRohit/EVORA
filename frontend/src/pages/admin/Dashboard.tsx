import { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Zap, 
  Calendar, 
  TrendingUp,
  Settings,
  Clock,
  Layers,
  DollarSign,
  Activity,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AddStationModal from '../../components/modals/AddStationModal';
import AddChargerModal from '../../components/modals/AddChargerModal';
import AddSlotModal from '../../components/modals/AddSlotModal';
import PeakHourChart from '../../components/PeakHourChart';
import WalkInBookingPanel from '../../components/admin/WalkInBookingPanel';
import ManualArrivalVerification from '../../components/admin/ManualArrivalVerification';
import { stationAPI, slotAPI, bookingAPI } from '../../lib/api';

interface Station {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  supported_charger_types?: string[];
  chargers?: Charger[];
}

interface Charger {
  id: string;
  charger_type: string;
  status?: string;
}

interface Slot {
  id: string;
  charger_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Booking {
  id: string;
  start_time?: string;
  created_at?: string;
  amount?: number;
  status?: string;
  booking_type?: string;
}

/* ----------------------------
   Metric Card Component
----------------------------- */
const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendLabel,
  color = "emerald" 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color?: "emerald" | "purple" | "amber" | "cyan";
}) => {
  const colorClasses = {
    emerald: "from-emerald-500/20 to-cyan-500/10 border-emerald-500/30",
    purple: "from-purple-500/20 to-pink-500/10 border-purple-500/30",
    amber: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
    cyan: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
  };
  
  const iconColors = {
    emerald: "text-emerald-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
    cyan: "text-cyan-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/60 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {trendLabel && (
            <p className={`text-xs mt-2 ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-white/50"}`}>
              {trend === "up" && "↑ "}
              {trend === "down" && "↓ "}
              {trendLabel}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [showAddChargerModal, setShowAddChargerModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [availableCounts, setAvailableCounts] = useState<Record<string, number>>({});

  // Fetch all bookings for metrics
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await bookingAPI.getBookings();
        setBookings(res.data || []);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        setBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, []);

  // Calculate today's metrics
  const todayMetrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.created_at || b.start_time || "").toDateString();
      return bookingDate === today;
    });
    
    const todayRevenue = todayBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const activeBookings = bookings.filter(b => {
      const status = (b.status || "").toLowerCase();
      return status === "active" || status === "paid" || status === "confirmed";
    });
    
    // Find peak hour
    const hourCounts: Record<number, number> = {};
    bookings.forEach(b => {
      const timeStr = b.start_time || b.created_at;
      if (!timeStr) return;
      const hour = new Date(timeStr).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    let peakHour = 0;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    });
    
    const peakHourLabel = maxCount > 0 
      ? `${String(peakHour).padStart(2, "0")}:00 - ${String(peakHour + 1).padStart(2, "0")}:00`
      : "No data";

    return {
      todayBookings: todayBookings.length,
      todayRevenue,
      activeBookings: activeBookings.length,
      peakHour: peakHourLabel,
    };
  }, [bookings]);

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
      // Fetch chargers for each station
      const stationsWithChargers = await Promise.all(
        response.data.map(async (station: Station) => {
          try {
            const chargersRes = await stationAPI.getChargersWithSlots(station.id);
            const chargers = chargersRes.data || [];  // API returns array directly
            // Collect all available slots with charger_id added
            const slots: Slot[] = chargers.flatMap((c: any) => 
              (c.slots || []).filter((s: Slot) => s.is_available).map((s: Slot) => ({
                ...s,
                charger_id: c.id  // Add charger_id to each slot
              }))
            );
            setAllSlots(prev => [...prev.filter(s => !slots.find(ns => ns.id === s.id)), ...slots]);
            return { ...station, chargers };
          } catch {
            return station;
          }
        })
      );
      setStations(stationsWithChargers);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  // Walk-in booking handler
  const handleCreateWalkInBooking = async (data: any) => {
    try {
      const result = await bookingAPI.createWalkInBooking({
        vehicle_number: data.vehicleNumber,
        user_name: data.userName,
        user_phone: data.userPhone,
        station_id: data.stationId,
        charger_id: data.chargerId,
        slot_id: data.slotId,
        is_emergency: data.isEmergency,
        amount: data.amount,
      });
      // Refresh data after booking
      fetchStations();
      return { ticket_id: result.data.ticket_id, booking_id: result.data.booking_id };
    } catch (error) {
      console.error('Walk-in booking failed:', error);
      throw error;
    }
  };

  // Manual verification handlers
  const handleVerifyBooking = async (identifier: string, type: "booking_id" | "vehicle_number" | "ticket_id") => {
    try {
      const result = await bookingAPI.verifyBooking(identifier, type);
      return result.data;
    } catch {
      return null;
    }
  };

  const handleConfirmArrival = async (bookingId: string) => {
    await bookingAPI.confirmArrival(bookingId);
  };

  const handleStartCharging = async (bookingId: string) => {
    await bookingAPI.startCharging(bookingId);
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
    <AdminDashboardLayout userName="Admin User">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="p-10 space-y-8 relative overflow-hidden"
      >
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-purple-200 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-white/70 text-sm mt-2">Manage stations and monitor platform performance</p>
            </div>
            <button 
              onClick={() => setShowAddStationModal(true)} 
              className="inline-flex items-center gap-2 rounded-full bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(168,85,247,0.8)] hover:bg-purple-400 transition"
            >
              <MapPin className="w-4 h-4" /> Add Station
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              icon={Calendar} 
              label="Today's Bookings" 
              value={todayMetrics.todayBookings}
              trend="up"
              trendLabel="vs yesterday"
              color="emerald"
            />
            <MetricCard 
              icon={DollarSign} 
              label="Today's Revenue" 
              value={`₹${todayMetrics.todayRevenue.toLocaleString()}`}
              trend="up"
              trendLabel="Real-time"
              color="purple"
            />
            <MetricCard 
              icon={Activity} 
              label="Active Sessions" 
              value={todayMetrics.activeBookings}
              trendLabel="Currently charging"
              color="cyan"
            />
            <MetricCard 
              icon={Clock} 
              label="Peak Hour" 
              value={todayMetrics.peakHour}
              trendLabel="Highest demand"
              color="amber"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Station Management - 2 columns */}
            <div className="xl:col-span-2 rounded-3xl bg-white/[0.06] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-xl text-white">Station Management</h2>
                  <p className="text-sm text-white/50 mt-1">{stats.totalStations} stations • {stats.availableSlots} available slots</p>
                </div>
                <button
                  onClick={() => navigate("/admin/stations")}
                  className="text-sm text-purple-300 hover:text-purple-200"
                >
                  View all →
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : stations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/60">
                  <MapPin className="w-12 h-12 mb-4 text-white/30" />
                  <p>No stations available</p>
                  <button
                    onClick={() => setShowAddStationModal(true)}
                    className="mt-4 text-sm text-purple-300 hover:text-purple-200"
                  >
                    Add your first station →
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {stations.slice(0, 5).map((station) => (
                    <div 
                      key={station.id} 
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all duration-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-purple-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white">{station.name}</h3>
                            <p className="text-sm text-white/50 truncate">{station.address}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                              <span className="flex items-center gap-1.5 text-xs text-white/60">
                                <Layers className="w-3.5 h-3.5 text-purple-400" />
                                {(station.supported_charger_types?.length ?? 0)} charger types
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-white/60">
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                                {availableCounts[station.id] ?? 0} available slots
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => handleAddCharger(station.id)} 
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition flex items-center gap-1"
                          >
                            <Zap className="w-3.5 h-3.5" /> Charger
                          </button>
                          <button 
                            onClick={() => handleAddSlot(station.id)} 
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition flex items-center gap-1"
                          >
                            <Clock className="w-3.5 h-3.5" /> Slot
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/stations/${station.id}/manage`)}
                            className="rounded-lg bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-500/30 transition flex items-center gap-1"
                          >
                            <Settings className="w-3.5 h-3.5" /> Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Peak Hours Chart - 1 column */}
            <div className="xl:col-span-1">
              <PeakHourChart 
                bookings={bookings}
                title="Peak Charging Hours"
                description="Demand distribution analysis"
                showRecommendation={false}
              />
            </div>
          </div>

          {/* Walk-In & Manual Verification Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WalkInBookingPanel
              stations={stations}
              slots={allSlots}
              onCreateBooking={handleCreateWalkInBooking}
            />
            <ManualArrivalVerification
              onVerify={handleVerifyBooking}
              onConfirmArrival={handleConfirmArrival}
              onStartCharging={handleStartCharging}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-white/50">Total Stations</p>
              <p className="text-xl font-semibold text-white mt-1">{stats.totalStations}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-white/50">Available Slots</p>
              <p className="text-xl font-semibold text-white mt-1">{stats.availableSlots}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-white/50">Total Bookings</p>
              <p className="text-xl font-semibold text-white mt-1">{bookings.length}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-white/50">Total Revenue</p>
              <p className="text-xl font-semibold text-white mt-1">
                ₹{bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <AddStationModal isOpen={showAddStationModal} onClose={() => setShowAddStationModal(false)} onSuccess={fetchStations} />
        <AddChargerModal isOpen={showAddChargerModal} onClose={() => setShowAddChargerModal(false)} stationId={selectedStationId} onSuccess={fetchStations} />
        <AddSlotModal isOpen={showAddSlotModal} onClose={() => setShowAddSlotModal(false)} stationId={selectedStationId} onSuccess={fetchStations} />
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;