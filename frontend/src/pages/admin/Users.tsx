import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  User,
  Car,
  Mail,
  Calendar,
  ChevronRight,
  Search,
  Zap,
  Plus,
} from 'lucide-react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { carAPI, authAPI } from '../../lib/api';
import AddCarModal from '../../components/modals/AddCarModal';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  car_number: string;
  charger_type: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  created_at?: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  vehicles?: Vehicle[];
}

const AdminUsersPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'vehicles'>('vehicles');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      // Try to fetch all vehicles (admin endpoint if available)
      // Fallback to current user's vehicles for demo
      const res = await carAPI.getCars();
      setVehicles(res.data || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const query = searchQuery.toLowerCase();
    return (
      v.brand?.toLowerCase().includes(query) ||
      v.model?.toLowerCase().includes(query) ||
      v.car_number?.toLowerCase().includes(query) ||
      v.charger_type?.toLowerCase().includes(query) ||
      v.user_name?.toLowerCase().includes(query) ||
      v.user_email?.toLowerCase().includes(query)
    );
  });

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
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-purple-200 bg-clip-text text-transparent">
                  Users & Vehicles
                </h1>
                <p className="text-white/70 text-sm mt-1">View registered users and their vehicles</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'vehicles'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Car className="w-4 h-4 inline mr-2" />
              Registered Vehicles
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'users'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Users
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicles, users..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            />
          </div>

          {/* Content */}
          {activeTab === 'vehicles' && (
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-xl text-white">Registered Vehicles</h2>
                  <p className="text-sm text-white/50 mt-1">{filteredVehicles.length} vehicles found</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Vehicle
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/60">
                  <Car className="w-12 h-12 mb-4 text-white/30" />
                  <p>No vehicles registered yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">User</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">Vehicle</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">Charger Type</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">Reg. Number</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredVehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-white/[0.03] transition">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <User className="w-4 h-4 text-purple-300" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{vehicle.user_name || 'User'}</p>
                                <p className="text-xs text-white/50">{vehicle.user_email || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-white">{vehicle.brand} {vehicle.model}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs">
                              <Zap className="w-3 h-3" />
                              {vehicle.charger_type}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-mono text-white/80">{vehicle.car_number}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-white/50">
                              {vehicle.created_at 
                                ? new Date(vehicle.created_at).toLocaleDateString()
                                : '-'
                              }
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6">
              <div className="flex flex-col items-center justify-center py-12 text-white/60">
                <Users className="w-12 h-12 mb-4 text-white/30" />
                <p className="text-lg mb-2">User Management</p>
                <p className="text-sm text-white/40">Detailed user list coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Add Vehicle Modal */}
        <AddCarModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchVehicles}
        />
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminUsersPage;
