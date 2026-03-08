import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Clock, TrendingUp } from "lucide-react"

interface PeakHourChartProps {
  bookings: Array<{
    id: string
    start_time?: string
    created_at?: string
  }>
  title?: string
  description?: string
  showRecommendation?: boolean
}

interface HourData {
  hour: string
  label: string
  count: number
  isPeak: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as HourData
    return (
      <div className="rounded-xl border border-white/10 bg-[#0a1016]/95 backdrop-blur-xl p-3 shadow-xl">
        <p className="text-sm font-semibold text-white">{data.label}</p>
        <p className="text-lg font-bold text-emerald-300 mt-1">{data.count} bookings</p>
        {data.isPeak && (
          <p className="text-xs text-amber-300 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Peak hour
          </p>
        )}
      </div>
    )
  }
  return null
}

const PeakHourChart = ({
  bookings,
  title = "Peak Charging Hours",
  description = "Booking distribution by hour",
  showRecommendation = true,
}: PeakHourChartProps) => {
  const hourData = useMemo(() => {
    // Initialize all hours
    const hours: HourData[] = Array.from({ length: 24 }, (_, i) => ({
      hour: String(i).padStart(2, "0"),
      label: `${String(i).padStart(2, "0")}:00 - ${String(i + 1).padStart(2, "0")}:00`,
      count: 0,
      isPeak: false,
    }))

    // Count bookings per hour
    bookings.forEach((booking) => {
      const timeStr = booking.start_time || booking.created_at
      if (!timeStr) return
      const date = new Date(timeStr)
      const hour = date.getHours()
      if (hour >= 0 && hour < 24) {
        hours[hour].count += 1
      }
    })

    // Find peak hour
    const maxCount = Math.max(...hours.map((h) => h.count))
    if (maxCount > 0) {
      hours.forEach((h) => {
        if (h.count === maxCount) {
          h.isPeak = true
        }
      })
    }

    // Group into ranges for better visualization (6-hour blocks)
    const rangeData: HourData[] = [
      {
        hour: "00-06",
        label: "12AM - 6AM",
        count: hours.slice(0, 6).reduce((sum, h) => sum + h.count, 0),
        isPeak: false,
      },
      {
        hour: "06-12",
        label: "6AM - 12PM",
        count: hours.slice(6, 12).reduce((sum, h) => sum + h.count, 0),
        isPeak: false,
      },
      {
        hour: "12-18",
        label: "12PM - 6PM",
        count: hours.slice(12, 18).reduce((sum, h) => sum + h.count, 0),
        isPeak: false,
      },
      {
        hour: "18-24",
        label: "6PM - 12AM",
        count: hours.slice(18, 24).reduce((sum, h) => sum + h.count, 0),
        isPeak: false,
      },
    ]

    // Find peak range
    const maxRangeCount = Math.max(...rangeData.map((r) => r.count))
    if (maxRangeCount > 0) {
      rangeData.forEach((r) => {
        if (r.count === maxRangeCount) {
          r.isPeak = true
        }
      })
    }

    return rangeData
  }, [bookings])

  const peakHour = useMemo(() => {
    return hourData.find((h) => h.isPeak)
  }, [hourData])

  const quietHour = useMemo(() => {
    const nonZero = hourData.filter((h) => h.count > 0)
    if (nonZero.length === 0) return null
    return nonZero.reduce((min, h) => (h.count < min.count ? h : min), nonZero[0])
  }, [hourData])

  const hasData = hourData.some((h) => h.count > 0)

  return (
    <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-white">{title}</h3>
          <p className="text-xs text-white/50">{description}</p>
        </div>
        <Clock className="w-5 h-5 text-emerald-400" />
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-white/60">
            No booking data available yet. Peak hours will be shown once bookings are made.
          </p>
        </div>
      ) : (
        <>
          <div className="h-48 rounded-2xl border border-white/10 bg-black/30 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {hourData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isPeak ? "#f59e0b" : "#34d399"}
                      opacity={entry.isPeak ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peak indicator */}
          {peakHour && (
            <div className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-200">Peak Hours: {peakHour.label}</p>
                <p className="text-xs text-amber-300/70">{peakHour.count} bookings during this time</p>
              </div>
            </div>
          )}

          {/* Recommendation for users */}
          {showRecommendation && quietHour && quietHour !== peakHour && (
            <div className="mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-200">Best time to charge</p>
                <p className="text-xs text-emerald-300/70">
                  {quietHour.label} has lower demand with only {quietHour.count} bookings
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PeakHourChart
