import { motion } from "framer-motion"
import { Sparkles, Clock, Zap, TrendingDown, ChevronRight } from "lucide-react"
import {
  SlotRecommendation,
  getRecommendationLabel,
  getRecommendationColor,
} from "@/lib/recommendationEngine"

interface SmartSlotRecommendationCardProps {
  recommendations: SlotRecommendation[]
  onSelectRecommendation: (recommendation: SlotRecommendation) => void
  selectedSlotId?: string
}

const formatTime = (iso: string) => {
  if (!iso) return "--:--"
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const formatDate = (iso: string) => {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" })
}

const getIcon = (type: string) => {
  switch (type) {
    case "fastest":
      return <Zap className="w-4 h-4" />
    case "least_busy":
      return <Clock className="w-4 h-4" />
    case "cost_optimized":
      return <TrendingDown className="w-4 h-4" />
    default:
      return <Sparkles className="w-4 h-4" />
  }
}

export const SmartSlotRecommendationCard = ({
  recommendations,
  onSelectRecommendation,
  selectedSlotId,
}: SmartSlotRecommendationCardProps) => {
  if (recommendations.length === 0) return null

  const topRecommendation = recommendations[0]
  const isSelected = selectedSlotId === topRecommendation.slot.id

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
    >
      {/* Header with AI badge */}
      <div className="bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 border border-white/10 rounded-t-3xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              Smart Recommendations
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 uppercase tracking-wider">
                AI Powered
              </span>
            </h3>
            <p className="text-xs text-white/60">
              Optimized suggestions based on availability & pricing
            </p>
          </div>
        </div>
      </div>

      {/* Top Recommendation - Highlighted */}
      <div className="bg-white/[0.04] border-x border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider text-white/50">
            Best Match
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRecommendationColor(
              topRecommendation.type
            )} text-white font-medium`}
          >
            {topRecommendation.reason}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white">
              {formatTime(topRecommendation.slot.start_time)}
              <span className="text-white/40 mx-2">→</span>
              {formatTime(topRecommendation.slot.end_time)}
            </div>
            <p className="text-sm text-white/60">
              {formatDate(topRecommendation.slot.start_time)} •{" "}
              {topRecommendation.charger.name || topRecommendation.charger.charger_type}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">
              ₹{topRecommendation.estimatedCost.toFixed(0)}
            </p>
            <p className="text-xs text-white/50">estimated</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelectRecommendation(topRecommendation)}
          className={`mt-5 w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
            isSelected
              ? "bg-emerald-400 text-slate-900"
              : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/30"
          }`}
        >
          {isSelected ? (
            <>
              <Zap className="w-4 h-4" />
              Selected
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Select Recommended Slot
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>

      {/* Alternative Recommendations */}
      {recommendations.length > 1 && (
        <div className="bg-white/[0.02] border border-white/10 rounded-b-3xl p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
            Other Options
          </p>
          <div className="space-y-2">
            {recommendations.slice(1).map((rec) => (
              <motion.button
                key={rec.slot.id}
                whileHover={{ x: 4 }}
                onClick={() => onSelectRecommendation(rec)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  selectedSlotId === rec.slot.id
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : "bg-white/5 hover:bg-white/10 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getRecommendationColor(
                      rec.type
                    )} flex items-center justify-center text-white`}
                  >
                    {getIcon(rec.type)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">
                      {formatTime(rec.slot.start_time)} - {formatTime(rec.slot.end_time)}
                    </p>
                    <p className="text-xs text-white/50">{rec.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">
                    ₹{rec.estimatedCost.toFixed(0)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default SmartSlotRecommendationCard
