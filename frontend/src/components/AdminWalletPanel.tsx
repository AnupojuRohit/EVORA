import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  CreditCard,
  Building,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
} from "lucide-react"

interface Transaction {
  id: string
  user_name?: string
  user_email?: string
  amount: number
  payment_method?: string
  created_at: string
  station_name?: string
  status?: string
  type?: "credit" | "debit"
}

interface AdminWalletPanelProps {
  transactions: Transaction[]
  loading?: boolean
}

/* ----------------------------
   Withdraw Modal (Placeholder)
----------------------------- */
const WithdrawModal = ({
  isOpen,
  onClose,
  balance,
}: {
  isOpen: boolean
  onClose: () => void
  balance: number
}) => {
  const [amount, setAmount] = useState<number | "">("")
  const [step, setStep] = useState<"amount" | "confirm" | "success">("amount")
  const [processing, setProcessing] = useState(false)

  const handleProceed = () => {
    if (typeof amount === "number" && amount > 0 && amount <= balance) {
      setStep("confirm")
    }
  }

  const handleConfirm = () => {
    setProcessing(true)
    // Simulate processing delay
    setTimeout(() => {
      setProcessing(false)
      setStep("success")
    }, 1500)
  }

  const handleClose = () => {
    setStep("amount")
    setAmount("")
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
              <h2 className="text-xl font-semibold text-white">Withdraw Funds</h2>
              <p className="text-sm text-white/50 mt-1">Transfer to bank account</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 hover:bg-white/10 transition"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {step === "amount" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/50">Available balance</p>
                <p className="text-2xl font-semibold text-emerald-300 mt-1">
                  ₹{balance.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/70 mb-2">Enter withdrawal amount</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">₹</span>
                  <input
                    type="number"
                    value={amount === "" ? "" : amount}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "") {
                        setAmount("")
                      } else {
                        setAmount(parseInt(val, 10))
                      }
                    }}
                    placeholder="Enter amount"
                    max={balance}
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>
              </div>

              <button
                onClick={handleProceed}
                disabled={typeof amount !== "number" || amount <= 0 || amount > balance}
                className={`w-full rounded-full py-3 font-semibold transition ${
                  typeof amount === "number" && amount > 0 && amount <= balance
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                Proceed
              </button>

              <p className="text-xs text-white/40 text-center">
                Note: This is a frontend placeholder. No actual withdrawal will occur.
              </p>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Withdrawal amount</span>
                  <span className="text-white font-semibold">₹{(amount as number).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Transfer to</span>
                  <span className="text-white flex items-center gap-2">
                    <Building className="w-4 h-4" /> Bank Account
                  </span>
                </div>
                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-sm">
                  <span className="text-white/60">Remaining balance</span>
                  <span className="text-emerald-300 font-semibold">
                    ₹{(balance - (amount as number)).toLocaleString()}
                  </span>
                </div>
              </div>

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
                  {processing ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Withdrawal Requested</h3>
                <p className="text-sm text-white/60 mt-2">
                  ₹{(amount as number).toLocaleString()} withdrawal request has been submitted.
                </p>
                <p className="text-xs text-white/40 mt-2">
                  (This is a placeholder - no actual transfer occurred)
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full rounded-full bg-white/10 py-3 text-white hover:bg-white/15 transition"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ----------------------------
   Admin Wallet Panel
----------------------------- */
const AdminWalletPanel = ({ transactions, loading }: AdminWalletPanelProps) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const totalBalance = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      const amount = Number(tx.amount) || 0
      if (tx.type === "debit") return sum - amount
      return sum + amount
    }, 0)
  }, [transactions])

  const todayTransactions = useMemo(() => {
    const today = new Date().toDateString()
    return transactions.filter((tx) => {
      const txDate = new Date(tx.created_at).toDateString()
      return txDate === today
    })
  }, [transactions])

  const todayRevenue = useMemo(() => {
    return todayTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  }, [todayTransactions])

  return (
    <>
      <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Platform Wallet</h2>
              <p className="text-sm text-white/50">Total revenue & transactions</p>
            </div>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_12px_30px_-20px_rgba(52,211,153,0.8)] hover:bg-emerald-400 transition"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-xs text-emerald-300/70">Total Platform Balance</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">
              ₹{totalBalance.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">Today's Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">
              ₹{todayRevenue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">Today's Transactions</p>
            <p className="text-2xl font-bold text-white mt-1">{todayTransactions.length}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <Wallet className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No transactions yet</p>
              <p className="text-sm text-white/40 mt-1">User payments will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-white/50" />
                          <p className="font-medium text-white">{tx.user_name || tx.user_email || "User"}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {tx.payment_method || "UPI"}
                          </span>
                          {tx.station_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {tx.station_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-emerald-400">+₹{tx.amount}</p>
                      <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(tx.created_at).toLocaleDateString()}
                        <Clock className="w-3 h-3 ml-2" />
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        balance={totalBalance}
      />
    </>
  )
}

export default AdminWalletPanel
