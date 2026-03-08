import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import AdminWalletPanel from '../../components/AdminWalletPanel';
import { bookingAPI } from '../../lib/api';

interface Transaction {
  id: string;
  user_name?: string;
  user_email?: string;
  amount: number;
  payment_method?: string;
  created_at: string;
  station_name?: string;
  status?: string;
  type?: "credit" | "debit";
}

const AdminWalletPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch all bookings as transactions
      const res = await bookingAPI.getBookings();
      // Transform bookings to transaction format
      const txData = (res.data || []).map((booking: any) => ({
        id: booking.id,
        user_name: booking.user_name || booking.user?.name || 'User',
        user_email: booking.user_email || booking.user?.email,
        amount: Number(booking.amount) || 0,
        payment_method: booking.payment_method || 'UPI',
        created_at: booking.created_at || new Date().toISOString(),
        station_name: booking.station_name || booking.station?.name,
        status: booking.status || 'completed',
        type: 'credit' as const,
      }));
      setTransactions(txData);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
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
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-200 bg-clip-text text-transparent">
                Platform Wallet
              </h1>
              <p className="text-white/70 text-sm mt-1">Manage revenue and view all transactions</p>
            </div>
          </div>

          {/* Wallet Panel */}
          <AdminWalletPanel transactions={transactions} loading={loading} />
        </div>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminWalletPage;
