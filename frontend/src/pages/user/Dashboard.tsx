import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import AppleStat from "./AppleStat"
import Row from "./Row"
import { carAPI, stationAPI, bookingAPI } from "../../lib/api"
import ArrivalTimerCard from "@/components/ArrivalTimerCard"
import ActiveBookingCard from "@/components/ActiveBookingCard"
import PeakHourChart from "@/components/PeakHourChart"
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  Receipt,
  Sparkles,
  Timer,
  Wallet,
  Zap,
  AlertTriangle,
} from "lucide-react"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const Dashboard = () => {
  
  const [vehicles, setVehicles] = useState<any[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [tx, setTx] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [loadingStations, setLoadingStations] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [availableOnly, setAvailableOnly] = useState(false)
  const [metricCounts, setMetricCounts] = useState({
    active: 0,
    upcoming: 0,
    completed: 0,
    spend: 0,
    saved: 0,
    vehicles: 0,
  })
  
  // Penalty state management (persisted in localStorage)
  const [hasPenalty, setHasPenalty] = useState(() => {
    return localStorage.getItem("evora_penalty") === "true"
  })
  const [arrivedBookings, setArrivedBookings] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("evora_arrived_bookings")
    return stored ? new Set(JSON.parse(stored)) : new Set()
  })

  const navigate = useNavigate()

  useEffect(() => {
    carAPI.getCars()
      .then(r => setVehicles(r.data))
      .finally(() => setLoadingVehicles(false))

    stationAPI.getNearbyStations(17.48, 78.52)
      .then(r => setStations(r.data))
      .finally(() => setLoadingStations(false))

    bookingAPI.getMyBookings()
      .then(r => {
        setBookings(r.data)
        setTx(r.data.slice(0, 3))
      })
      .finally(() => setLoadingBookings(false))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const primaryVehicle = vehicles[0]
  const formatDuration = (ms?: number) => {
    if (!ms || ms <= 0) return "—"
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatCountdown = (ms?: number | null) => {
    if (!ms || ms <= 0) return "00:00"
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  const upcomingBookings = bookings.filter(b => b.start_time && new Date(b.start_time).getTime() > now)
  const pastBookings = bookings.filter(b => {
    if (b.end_time) return new Date(b.end_time).getTime() < now
    const status = (b.status || "").toString().toLowerCase()
    return ["completed", "done", "finished"].includes(status)
  })
  const activeBookings = bookings.filter(b => {
    if (!b.start_time || !b.end_time) return false
    const start = new Date(b.start_time).getTime()
    const end = new Date(b.end_time).getTime()
    return now >= start && now <= end
  })

  // Find active ticket that hasn't expired yet
  // Only show bookings where arrival window hasn't ended:
  // - Upcoming bookings (start_time > now)
  // - Currently active bookings (start <= now <= end)
  // - Bookings within arrival window (created_at + 20min > now)
  const ticketBooking = useMemo(() => {
    const arrivalWindowMs = 20 * 60 * 1000 // 20 minutes
    
    // Helper to parse UTC datetime from backend
    const parseUTC = (str: string) => {
      let t = str
      if (!t.endsWith('Z') && !t.includes('+') && !t.includes('-', 10)) {
        t = t.replace(' ', 'T') + 'Z'
      }
      return new Date(t).getTime()
    }
    
    // Filter to only bookings that are still valid (not completely expired)
    const validBookings = bookings.filter(b => {
      if (!b.start_time || !b.created_at) return false
      const createdAt = parseUTC(b.created_at)
      const endTime = b.end_time ? parseUTC(b.end_time) : parseUTC(b.start_time) + 60 * 60 * 1000
      const arrivalDeadline = createdAt + arrivalWindowMs
      
      // Valid if: currently in session OR still within arrival window from booking time
      return now < endTime || now < arrivalDeadline
    })
    
    // Sort by start_time (soonest first)
    const sorted = validBookings.sort((a, b) => {
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })
    
    // Find first booking that user hasn't confirmed arrival for
    return sorted.find(b => !arrivedBookings.has(b.id)) || sorted[0] || null
  }, [bookings, now, arrivedBookings])

  // Arrival handlers
  const handleArrivalConfirm = (bookingId: string) => {
    const newArrivedSet = new Set(arrivedBookings)
    newArrivedSet.add(bookingId)
    setArrivedBookings(newArrivedSet)
    localStorage.setItem("evora_arrived_bookings", JSON.stringify([...newArrivedSet]))
  }

  const handleExtensionRequest = (bookingId: string, extraMinutes: number) => {
    console.log(`Extension requested for ${bookingId}: +${extraMinutes} minutes`)
    // In production, this would call the backend
  }

  const handleMissed = (bookingId: string) => {
    setHasPenalty(true)
    localStorage.setItem("evora_penalty", "true")
    console.log(`Booking ${bookingId} marked as missed`)
  }

  // Arrival deadline: created_at + 20 minute arrival window
  const arrivalDeadline = useMemo(() => {
    if (!ticketBooking?.created_at) return null
    let t = ticketBooking.created_at
    if (!t.endsWith('Z') && !t.includes('+') && !t.includes('-', 10)) {
      t = t.replace(' ', 'T') + 'Z'
    }
    return new Date(t).getTime() + 20 * 60 * 1000
  }, [ticketBooking])

  const arrivalRemaining = arrivalDeadline ? arrivalDeadline - now : null
  const arrivalExpired = arrivalRemaining !== null && arrivalRemaining <= 0

  const totalSpend = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  const monthSpend = bookings.reduce((sum, b) => {
    if (!b.created_at) return sum
    const date = new Date(b.created_at)
    const sameMonth = date.getMonth() === new Date(now).getMonth() && date.getFullYear() === new Date(now).getFullYear()
    return sameMonth ? sum + (Number(b.amount) || 0) : sum
  }, 0)

  const greenSessions = pastBookings.length
  const ecoBadge = greenSessions >= 20 ? "Green Pioneer" : greenSessions >= 10 ? "Eco Builder" : "Getting Started"

  const chargerTypes = useMemo(() => {
    const set = new Set<string>()
    stations.forEach((s: any) => {
      s.supported_charger_types?.forEach((t: string) => set.add(t))
    })
    return ["all", ...Array.from(set)]
  }, [stations])

  const filteredStations = stations.filter((s: any) => {
    if (typeFilter !== "all") {
      const match = s.supported_charger_types?.includes(typeFilter)
      if (!match) return false
    }
    if (availableOnly && typeof s.available_slots === "number") {
      return s.available_slots > 0
    }
    return true
  })

  const ecoData = useMemo(() => {
    const weeks = 6
    const labels = Array.from({ length: weeks }, (_, i) => `W${i + 1}`)
    const series = labels.map(label => ({ label, sessions: 0, co2: 0 }))

    bookings.forEach(b => {
      if (!b.created_at) return
      const date = new Date(b.created_at)
      const diffWeeks = Math.floor((now - date.getTime()) / (7 * 24 * 60 * 60 * 1000))
      if (diffWeeks < 0 || diffWeeks >= weeks) return
      const index = weeks - 1 - diffWeeks
      series[index].sessions += 1
      series[index].co2 += Number(b.co2_saved || 0)
    })

    return series
  }, [bookings, now])

  const ecoHasData = ecoData.some(point => point.sessions > 0 || point.co2 > 0)
  const availableChargers = stations.reduce((sum, s: any) => {
    if (typeof s.available_slots === "number") return sum + s.available_slots
    return sum
  }, 0)

  useEffect(() => {
    const targets = {
      active: activeBookings.length,
      upcoming: upcomingBookings.length,
      completed: pastBookings.length,
      spend: totalSpend,
      saved: 0,
      vehicles: vehicles.length,
    }

    const duration = 800
    const start = performance.now()

    const tick = (nowTime: number) => {
      const progress = Math.min((nowTime - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setMetricCounts({
        active: Math.round(targets.active * ease),
        upcoming: Math.round(targets.upcoming * ease),
        completed: Math.round(targets.completed * ease),
        spend: Math.round(targets.spend * ease),
        saved: Math.round(targets.saved * ease),
        vehicles: Math.round(targets.vehicles * ease),
      })
      if (progress < 1) requestAnimationFrame(tick)
    }

    const frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [activeBookings.length, upcomingBookings.length, pastBookings.length, totalSpend, vehicles.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-10 space-y-10 relative overflow-hidden"
    >
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-200 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-white/70 text-sm mt-2">Booking-first control center for your charging network.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/bookings")}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black"
            >
              <Zap className="w-4 h-4" /> Find & Book Charger
            </button>
            <button
              onClick={() => navigate("/dashboard/bookings")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white"
            >
              <MapPin className="w-4 h-4 text-emerald-300" /> Nearby stations
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.9)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_55%),radial-gradient(circle_at_80%_20%,_rgba(34,211,238,0.12),_transparent_50%)]" />
              <div className="relative space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">Charging Command Center</h2>
                  <p className="text-sm text-white/60 mt-2">No active charging sessions</p>
                </div>

                <div>
                  <button
                    onClick={() => navigate("/dashboard/bookings")}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black shadow-[0_12px_30px_-20px_rgba(52,211,153,0.8)]"
                  >
                    <Zap className="w-4 h-4" /> Find & Book Charger
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-white/50">Nearby stations</p>
                    <p className="text-lg font-semibold text-white">{stations.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-white/50">Chargers available</p>
                    <p className="text-lg font-semibold text-white">{availableChargers}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-white/50">Average wait time</p>
                    <p className="text-lg font-semibold text-white">—</p>
                  </div>
                </div>
              </div>
            </div>

            {ticketBooking ? (
              <>
                {/* Active Booking Card with QR */}
                <ActiveBookingCard 
                  booking={ticketBooking}
                  onViewTicket={() => navigate(`/booking/ticket/${ticketBooking.id}`, {
                    state: {
                      ticketId: ticketBooking.ticket_id || ticketBooking.order_id || ticketBooking.id,
                      slot: {
                        id: ticketBooking.id,
                        start_time: ticketBooking.start_time,
                        end_time: ticketBooking.end_time,
                        charger_type: ticketBooking.charger_type,
                        total_price: ticketBooking.amount,
                      },
                      station: {
                        name: ticketBooking.station_name || ticketBooking.station?.name,
                        latitude: ticketBooking.station?.latitude,
                        longitude: ticketBooking.station?.longitude,
                      },
                      qrPayload: ticketBooking.ticket_id || ticketBooking.order_id || ticketBooking.id,
                      created_at: ticketBooking.created_at,
                    }
                  })}
                />
                
                {/* Arrival Timer Card */}
                <ArrivalTimerCard
                  booking={ticketBooking}
                  onArrivalConfirm={handleArrivalConfirm}
                  onExtensionRequest={handleExtensionRequest}
                  onMissed={handleMissed}
                  hasPenalty={hasPenalty}
                />
              </>
            ) : (
              /* Empty State - No Active Bookings */
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 p-6 backdrop-blur-xl">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">No Active Bookings</h3>
                    <p className="text-sm text-white/50 mt-1">
                      Book a charging slot to see your ticket here
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/dashboard/bookings")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-slate-900 font-semibold text-sm hover:bg-emerald-400 transition"
                  >
                    <Zap className="w-4 h-4" />
                    Find & Book Charger
                  </button>
                  
                  {pastBookings.length > 0 && (
                    <p className="text-xs text-white/40 pt-2">
                      You have {pastBookings.length} past booking{pastBookings.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="xl:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Eco Impact Analytics</h3>
                  <p className="text-xs text-white/50">CO₂ saved and sessions trend</p>
                </div>
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
              </div>
              {loadingBookings ? (
                <div className="h-56 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
              ) : !ecoHasData ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                  Eco impact tracking unlocks after your first completed charge.
                  <button
                    onClick={() => navigate("/dashboard/bookings")}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-black"
                  >
                    Start charging
                  </button>
                </div>
              ) : (
                <div className="h-56 rounded-2xl border border-white/10 bg-black/30 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ecoData}>
                      <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15,23,42,0.9)",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: 12,
                        }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Line type="monotone" dataKey="co2" stroke="#34d399" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="sessions" stroke="#22d3ee" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4" /> Badge: {ecoBadge}
              </div>
              <p className="text-xs text-white/50 mt-3">
                {greenSessions === 0
                  ? "Start your first completed session to unlock eco impact tracking."
                  : "Your charging sessions are matched with cleaner grid windows."}
              </p>
            </div>
            
            {/* Peak Hours Chart */}
            <PeakHourChart 
              bookings={bookings}
              title="Best Times to Charge"
              description="Find low-rush charging hours"
              showRecommendation={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <button onClick={() => navigate("/dashboard/bookings")} className="text-left xl:col-span-1">
            <AppleStat title="Active bookings" value={metricCounts.active} />
          </button>
          <button onClick={() => navigate("/dashboard/bookings")} className="text-left xl:col-span-1">
            <AppleStat title="Upcoming sessions" value={metricCounts.upcoming} />
          </button>
          <button onClick={() => navigate("/dashboard/bookings")} className="text-left xl:col-span-1">
            <AppleStat title="Completed charges" value={metricCounts.completed} />
          </button>
          <button onClick={() => navigate("/dashboard/transactions")} className="text-left xl:col-span-1">
            <AppleStat title="Total spend (₹)" value={metricCounts.spend} />
          </button>
          <div className="xl:col-span-1">
            <AppleStat title="Saved stations" value={metricCounts.saved} />
          </div>
          <button onClick={() => navigate("/dashboard/vehicles")} className="text-left xl:col-span-1">
            <AppleStat title="Registered vehicles" value={metricCounts.vehicles} />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl bg-white/[0.06] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Bookings Center</h3>
                <p className="text-xs text-white/50">Manage upcoming slots and review past sessions.</p>
              </div>
              <button
                onClick={() => navigate("/dashboard/bookings")}
                className="text-sm text-emerald-300 inline-flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Upcoming bookings</h4>
                  <span className="text-xs text-white/50">{upcomingBookings.length} scheduled</span>
                </div>
                {loadingBookings ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>No upcoming bookings. Lock in a slot to stay on schedule.</span>
                    <button
                      onClick={() => navigate("/dashboard/bookings")}
                      className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-black"
                    >
                      Book now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {upcomingBookings.slice(0, 4).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => navigate(`/booking/ticket/${b.id}`)}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition"
                      >
                        <p className="text-sm font-semibold">{b.station_name || "Station"}</p>
                        <p className="text-xs text-white/60">{b.charger_type || "Charger"}</p>
                        <p className="text-xs text-white/60 mt-2">{b.start_time ? new Date(b.start_time).toLocaleString() : "—"}</p>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-emerald-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Upcoming</span>
                          <span className="text-white/60">₹{b.amount || "—"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Past sessions</h4>
                  <span className="text-xs text-white/50">{pastBookings.length} completed</span>
                </div>
                {loadingBookings ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : pastBookings.length === 0 ? (
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>No completed sessions yet. Your charging history will appear here.</span>
                    <button
                      onClick={() => navigate("/dashboard/bookings")}
                      className="rounded-full border border-white/10 px-3 py-2 text-xs text-white"
                    >
                      View bookings
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastBookings.slice(0, 3).map((b) => (
                      <div key={b.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                        <div>
                          <p className="font-semibold">{b.station_name || "Station"}</p>
                          <p className="text-xs text-white/60">
                            {b.end_time ? new Date(b.end_time).toLocaleString() : "—"} ·
                            {b.start_time && b.end_time ? ` ${formatDuration(new Date(b.end_time).getTime() - new Date(b.start_time).getTime())}` : " —"}
                          </p>
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/60">₹{b.amount || "—"}</p>
                          <button className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-300">
                            <Receipt className="w-3.5 h-3.5" /> Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Stations Discovery</h3>
                <p className="text-xs text-white/50">Filter by charger type and live availability.</p>
              </div>
              <Filter className="w-4 h-4 text-emerald-300" />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {chargerTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`rounded-full px-3 py-1 text-xs border transition ${
                    typeFilter === type ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-white/60"
                  }`}
                >
                  {type === "all" ? "All types" : type}
                </button>
              ))}
              <button
                onClick={() => setAvailableOnly(v => !v)}
                className={`rounded-full px-3 py-1 text-xs border transition ${
                  availableOnly ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-white/60"
                }`}
              >
                Available only
              </button>
            </div>

            <div className="space-y-3">
              {loadingStations ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filteredStations.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                  No stations match the current filters. Try another charger type.
                </div>
              ) : (
                filteredStations.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-white/50">{s.distance_km} km • {Math.round((s.distance_km || 2) * 3)} min</p>
                      </div>
                      <span className={`text-xs ${s.available_slots > 0 ? "text-emerald-300" : "text-white/50"}`}>
                        {typeof s.available_slots === "number" ? `${s.available_slots} slots` : "Availability unknown"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {(s.supported_charger_types || ["DC"])
                        .slice(0, 2)
                        .map((t: string) => (
                          <span key={t} className="rounded-full bg-white/10 px-2 py-1 text-white/70">
                            {t}
                          </span>
                        ))}
                      <span className="rounded-full bg-white/10 px-2 py-1 text-white/70">
                        {typeof s.price_per_kwh === "number" ? `₹${s.price_per_kwh}/kWh` : "Price: —"}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-white/70">Amenities: Not listed</span>
                    </div>

                    <button
                      onClick={() => navigate("/dashboard/bookings")}
                      className="mt-4 w-full rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-black"
                    >
                      Book Now
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Wallet</h3>
                <p className="text-xs text-white/50">Balance and monthly spend</p>
              </div>
              <Wallet className="w-4 h-4 text-emerald-300" />
            </div>
            {tx.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                Wallet activity will appear here once your first payment is completed.
                <button
                  onClick={() => navigate("/dashboard/bookings")}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-black"
                >
                  Add funds & book
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/50">Wallet balance</p>
                  <p className="text-2xl font-semibold text-emerald-300 mt-2">₹—</p>
                  <p className="text-xs text-white/50 mt-1">Synced from payment provider</p>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Monthly spend</span>
                    <span className="font-semibold">₹{monthSpend}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (monthSpend / 8000) * 100)}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="xl:col-span-2 rounded-3xl bg-white/[0.06] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Recent transactions</h3>
                <p className="text-xs text-white/50">Invoices and payment history</p>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>

            {tx.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60 flex items-center justify-between">
                <span>No transactions yet. Your receipts will appear after your first charge.</span>
                <button
                  onClick={() => navigate("/dashboard/bookings")}
                  className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-black"
                >
                  Book a charge
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {loadingBookings ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                  ))
                ) : (
                  tx.slice(0, 4).map((t, index) => (
                    <div key={t.id || index}>
                      <Row
                        title={`${t.order_id || "Order"} · ${t.transaction_id || "—"}`}
                        subtitle={t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                        right={`₹${t.amount || "—"}`}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Dashboard
