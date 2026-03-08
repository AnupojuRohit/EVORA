import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  CreditCard,
  Smartphone,
  X,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Zap,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { bookingAPI } from "@/lib/api"

/* ----------------------------
   Types
----------------------------- */
interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  date: string
  status: "completed" | "pending" | "failed"
}

interface MonthlySpend {
  month: string
  amount: number
  isPeak: boolean
}

/* ----------------------------
   Add Money Modal
----------------------------- */
const AddMoneyModal = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: (amount: number) => void
  currentBalance: number
}) => {
  const [amount, setAmount] = useState<number | "">("")
  const [customAmount, setCustomAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi")
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<"amount" | "confirm">("amount")

  const presetAmounts = [200, 500, 1000, 2000]

  const handleSelectAmount = (value: number) => {
    setAmount(value)
    setCustomAmount("")
  }

  const handleCustomChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num > 0) {
      setAmount(num)
      setCustomAmount(value)
    } else if (value === "") {
      setAmount("")
      setCustomAmount("")
    }
  }

  const handleProceed = () => {
    if (typeof amount === "number" && amount > 0) {
      setStep("confirm")
    }
  }

  const handleConfirm = () => {
    if (typeof amount !== "number") return
    setProcessing(true)
    // Simulate processing delay
    setTimeout(() => {
      setProcessing(false)
      onSuccess(amount)
      onClose()
      setStep("amount")
      setAmount("")
      setCustomAmount("")
    }, 1500)
  }

  const handleClose = () => {
    setStep("amount")
    setAmount("")
    setCustomAmount("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a1016] p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Add Money</h2>
              <p className="text-sm text-white/50 mt-1">Top up your wallet balance</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 hover:bg-white/10 transition"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {step === "amount" ? (
            <div className="space-y-6">
              {/* Current Balance */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/50">Current balance</p>
                <p className="text-2xl font-semibold text-emerald-300 mt-1">
                  ₹{currentBalance.toLocaleString()}
                </p>
              </div>

              {/* Preset Amounts */}
              <div>
                <p className="text-sm text-white/70 mb-3">Select amount</p>
                <div className="grid grid-cols-2 gap-3">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleSelectAmount(preset)}
                      className={`rounded-xl border p-4 text-center transition ${
                        amount === preset
                          ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="text-lg font-semibold">₹{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <p className="text-sm text-white/70 mb-2">Or enter custom amount</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">₹</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-sm text-white/70 mb-3">Payment method</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                      paymentMethod === "upi"
                        ? "border-emerald-400/50 bg-emerald-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <Smartphone className={`w-5 h-5 ${paymentMethod === "upi" ? "text-emerald-300" : "text-white/60"}`} />
                    <span className={paymentMethod === "upi" ? "text-emerald-200" : "text-white"}>UPI</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                      paymentMethod === "card"
                        ? "border-emerald-400/50 bg-emerald-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 ${paymentMethod === "card" ? "text-emerald-300" : "text-white/60"}`} />
                    <span className={paymentMethod === "card" ? "text-emerald-200" : "text-white"}>Card</span>
                  </button>
                </div>
              </div>

              {/* Proceed Button */}
              <button
                onClick={handleProceed}
                disabled={typeof amount !== "number" || amount <= 0}
                className={`w-full rounded-full py-3 font-semibold transition ${
                  typeof amount === "number" && amount > 0
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                Proceed to Add ₹{typeof amount === "number" ? amount.toLocaleString() : "0"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Confirmation Summary */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Amount</span>
                  <span className="text-white font-semibold">₹{(amount as number).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Payment method</span>
                  <span className="text-white capitalize">{paymentMethod}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-sm">
                  <span className="text-white/60">New balance</span>
                  <span className="text-emerald-300 font-semibold">
                    ₹{(currentBalance + (amount as number)).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-white/50 text-center">
                By proceeding, you agree to our terms. Wallet credits are non-refundable.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("amount")}
                  className="flex-1 rounded-full border border-white/10 py-3 text-white hover:bg-white/5 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={processing}
                  className="flex-1 rounded-full bg-emerald-500 py-3 font-semibold text-black hover:bg-emerald-400 transition disabled:opacity-60"
                >
                  {processing ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ----------------------------
   Custom Tooltip
----------------------------- */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-xl border border-white/10 bg-[#0a1016]/95 backdrop-blur-xl p-3 shadow-xl">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-lg font-bold text-emerald-300 mt-1">₹{data.amount.toLocaleString()}</p>
        {data.isPeak && (
          <p className="text-xs text-amber-300 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Peak spending month
          </p>
        )}
      </div>
    )
  }
  return null
}

/* ----------------------------
   Wallet Page
----------------------------- */
const WalletPage = () => {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMoney, setShowAddMoney] = useState(false)

  useEffect(() => {
    // Load bookings for transaction history
    bookingAPI.getMyBookings()
      .then((r) => {
        setBookings(r.data)
        // Convert bookings to transactions
        const txns: Transaction[] = r.data.map((b: any, i: number) => ({
          id: b.id || `txn-${i}`,
          type: "debit" as const,
          amount: Number(b.amount) || 0,
          description: `Charging at ${b.station_name || "Station"}`,
          date: b.created_at || new Date().toISOString(),
          status: "completed" as const,
        }))
        setTransactions(txns)
      })
      .finally(() => setLoading(false))
  }, [])

  // Calculate monthly spending data for the graph
  const monthlySpending = useMemo((): MonthlySpend[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()
    const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12
      return { month: months[monthIndex], amount: 0, isPeak: false }
    })

    // Aggregate spending by month
    bookings.forEach((b) => {
      if (!b.created_at) return
      const date = new Date(b.created_at)
      const monthName = months[date.getMonth()]
      const entry = lastSixMonths.find((m) => m.month === monthName)
      if (entry) {
        entry.amount += Number(b.amount) || 0
      }
    })

    // Add some mock data if empty for demo
    if (lastSixMonths.every((m) => m.amount === 0)) {
      lastSixMonths[0].amount = 450
      lastSixMonths[1].amount = 820
      lastSixMonths[2].amount = 1200
      lastSixMonths[3].amount = 680
      lastSixMonths[4].amount = 950
      lastSixMonths[5].amount = 720
    }

    // Mark peak month
    const maxAmount = Math.max(...lastSixMonths.map((m) => m.amount))
    lastSixMonths.forEach((m) => {
      if (m.amount === maxAmount && maxAmount > 0) {
        m.isPeak = true
      }
    })

    return lastSixMonths
  }, [bookings])

  const totalSpend = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  }, [bookings])

  const thisMonthSpend = useMemo(() => {
    const now = new Date()
    return bookings.reduce((sum, b) => {
      if (!b.created_at) return sum
      const date = new Date(b.created_at)
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return sum + (Number(b.amount) || 0)
      }
      return sum
    }, 0)
  }, [bookings])

  const handleAddMoney = (amount: number) => {
    setBalance((prev) => prev + amount)
    // Add credit transaction
    const newTxn: Transaction = {
      id: `credit-${Date.now()}`,
      type: "credit",
      amount,
      description: "Wallet top-up",
      date: new Date().toISOString(),
      status: "completed",
    }
    setTransactions((prev) => [newTxn, ...prev])
  }

  const peakMonth = monthlySpending.find((m) => m.isPeak)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-10 space-y-8 relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-200 bg-clip-text text-transparent">
              Wallet
            </h1>
            <p className="text-white/70 text-sm mt-2">Manage your balance and track spending.</p>
          </div>
          <button
            onClick={() => setShowAddMoney(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_12px_30px_-20px_rgba(52,211,153,0.8)]"
          >
            <Plus className="w-4 h-4" /> Add Money
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 p-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.2),_transparent_60%)]" />
            <div className="relative">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <WalletIcon className="w-4 h-4" /> Wallet Balance
              </div>
              <p className="text-4xl font-bold text-white mt-3">₹{balance.toLocaleString()}</p>
              <p className="text-xs text-white/50 mt-2">Available for bookings</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
          >
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <TrendingUp className="w-4 h-4" /> This Month
            </div>
            <p className="text-3xl font-bold text-white mt-3">₹{thisMonthSpend.toLocaleString()}</p>
            <p className="text-xs text-white/50 mt-2">Spent on charging</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
          >
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Zap className="w-4 h-4 text-emerald-400" /> Total Charged
            </div>
            <p className="text-3xl font-bold text-white mt-3">₹{totalSpend.toLocaleString()}</p>
            <p className="text-xs text-white/50 mt-2">All time spend</p>
          </motion.div>
        </div>

        {/* Spending Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg text-white">Spending Analytics</h3>
              <p className="text-xs text-white/50 mt-1">Your EV charging spend trend</p>
            </div>
            {peakMonth && (
              <div className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
                <TrendingUp className="w-4 h-4 text-amber-300" />
                <span className="text-xs text-amber-200">Peak: {peakMonth.month}</span>
              </div>
            )}
          </div>

          <div className="h-64 rounded-2xl border border-white/10 bg-black/30 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpending} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#spendGradient)"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    if (payload.isPeak) {
                      return (
                        <circle
                          key={`dot-${payload.month}`}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#fbbf24"
                          stroke="#0a1016"
                          strokeWidth={2}
                        />
                      )
                    }
                    return (
                      <circle
                        key={`dot-${payload.month}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#34d399"
                        stroke="#0a1016"
                        strokeWidth={2}
                      />
                    )
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-white/40 mt-4 text-center">
            Monthly charging expenditure over the last 6 months
          </p>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg text-white">Transaction History</h3>
              <p className="text-xs text-white/50 mt-1">Recent wallet activity</p>
            </div>
            <button
              onClick={() => navigate("/dashboard/transactions")}
              className="text-sm text-emerald-300 inline-flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <WalletIcon className="w-8 h-8 text-white/30 mx-auto mb-3" />
              <p className="text-sm text-white/60">No transactions yet</p>
              <p className="text-xs text-white/40 mt-1">Your wallet activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 6).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === "credit" ? "bg-emerald-500/20" : "bg-white/10"
                      }`}
                    >
                      {txn.type === "credit" ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-white/60" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{txn.description}</p>
                      <p className="text-xs text-white/50">
                        {new Date(txn.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        txn.type === "credit" ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {txn.type === "credit" ? "+" : "-"}₹{txn.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {txn.status === "completed" ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs text-emerald-300">Completed</span>
                        </>
                      ) : txn.status === "pending" ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-xs text-amber-300">Pending</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-300">Failed</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowAddMoney(true)}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Add Money</p>
                  <p className="text-xs text-white/50">Top up wallet balance</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition" />
            </div>
          </button>

          <button
            onClick={() => navigate("/dashboard/bookings")}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Book Charging</p>
                  <p className="text-xs text-white/50">Find nearby stations</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition" />
            </div>
          </button>
        </div>
      </div>

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={showAddMoney}
        onClose={() => setShowAddMoney(false)}
        onSuccess={handleAddMoney}
        currentBalance={balance}
      />
    </motion.div>
  )
}

export default WalletPage
