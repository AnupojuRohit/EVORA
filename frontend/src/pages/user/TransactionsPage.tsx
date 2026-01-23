import { useEffect, useState } from "react";
import { bookingAPI } from "@/lib/api";
import { Receipt } from "lucide-react";

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
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "PAID":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  bookingAPI.getMyBookings().then(res => {
    console.log("TRANSACTIONS FROM API:", res.data);
    setTransactions(res.data);
    setLoading(false);
  });
}, []);


  useEffect(() => {
  const fetchTransactions = async () => {
    const res = await bookingAPI.getMyBookings();
    console.log("TRANSACTIONS API RESPONSE:", res.data);
    setTransactions(res.data);
    setLoading(false);
  };

  fetchTransactions();
}, []);
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Your payment & booking history
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-muted-foreground">Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <div className="card-elevated p-6 text-center text-muted-foreground">
          No transactions found.
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Transaction ID</th>
                <th className="px-4 py-3 text-left">Ticket ID</th>
                <th className="px-4 py-3 text-left">Amount (₹)</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-t border-border hover:bg-muted/40 transition"
                >
                  <td className="px-4 py-3 font-mono">
                    {tx.order_id}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {tx.transaction_id}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {tx.ticket_id}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ₹{tx.amount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        tx.booking_status
                      )}`}
                    >
                      {tx.booking_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
