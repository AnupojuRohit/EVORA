import { useEffect, useState } from "react";
import { bookingAPI } from "@/lib/api";
import { Receipt, Clock, CheckCircle, XCircle, CreditCard, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  order_id: string;
  transaction_id: string;
  ticket_id: string;
  amount: number;
  booking_status: string;
  created_at: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "CANCELLED":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "PAID":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="w-4 h-4" />;
    case "CANCELLED":
      return <XCircle className="w-4 h-4" />;
    case "PAID":
      return <CreditCard className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await bookingAPI.getMyBookings();
        console.log("TRANSACTIONS API RESPONSE:", res.data);
        setTransactions(res.data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-ambient text-white overflow-hidden">
      <div className="p-10 space-y-8 relative">

        {/* Ambient Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/6 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/4 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center animate-glow">
              <Receipt className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight animate-neon bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Transactions
              </h1>
              <p className="text-white/70 text-lg mt-2">
                Your payment & booking history
              </p>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full"></div>
              <span className="ml-4 text-white/70">Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-12 text-center animate-fade-up animate-delay-1">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
                <Receipt className="w-10 h-10 text-white/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
              <p className="text-white/60">Your booking history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 animate-delay-1">
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className="rounded-3xl bg-white/[0.06] border border-white/10 p-6 hover:bg-white/[0.08] transition-all duration-300 animate-fade-up hover-shimmer"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getStatusBadge(tx.booking_status)}`}>
                        {getStatusIcon(tx.booking_status)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Booking #{tx.order_id}</h4>
                        <p className="text-white/60 text-sm">Transaction: {tx.transaction_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">₹{tx.amount}</div>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(tx.booking_status)}`}>
                        {getStatusIcon(tx.booking_status)}
                        {tx.booking_status}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/50" />
                      <span className="text-white/70">Date:</span>
                      <span className="font-medium">{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/50" />
                      <span className="text-white/70">Time:</span>
                      <span className="font-medium">{new Date(tx.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-white/50" />
                      <span className="text-white/70">Ticket:</span>
                      <span className="font-mono font-medium">{tx.ticket_id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
