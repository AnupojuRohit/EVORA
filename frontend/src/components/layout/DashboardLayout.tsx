import { ReactNode, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Car,
  Calendar,
  Receipt,
  LogOut,
  Search,
  Bell,
  Moon,
  ChevronDown,
  Settings,
  Sparkles,
  Wallet
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import Logo from "../ui/Logo"
import { authAPI } from "../../lib/api"

const nav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Car, label: "My Cars", path: "/dashboard/vehicles" },
  { icon: Calendar, label: "Bookings", path: "/dashboard/bookings" },
  { icon: Wallet, label: "Wallet", path: "/dashboard/wallet" },
  { icon: Receipt, label: "Transactions", path: "/dashboard/transactions" },
]

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [name, setName] = useState("User")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const notifications = useMemo(
    () => [
      { id: "n1", title: "Charging session completed", time: "2m ago", unread: true },
      { id: "n2", title: "Slot confirmed at NeonGrid", time: "12m ago", unread: true },
      { id: "n3", title: "Wallet topped up", time: "1h ago", unread: false },
    ],
    []
  )

  const unreadCount = notifications.filter(n => n.unread).length

  // Load avatar from localStorage
  useEffect(() => {
    const savedAvatar = localStorage.getItem("evora_avatar")
    if (savedAvatar) setAvatar(savedAvatar)
    
    // Listen for avatar updates from ProfileSettings
    const handleAvatarUpdate = () => {
      const updatedAvatar = localStorage.getItem("evora_avatar")
      setAvatar(updatedAvatar)
    }
    
    window.addEventListener("avatarUpdate", handleAvatarUpdate)
    return () => window.removeEventListener("avatarUpdate", handleAvatarUpdate)
  }, [])

  useEffect(() => {
    authAPI.me().then(res => setName(res.data?.name || "User"))
  }, [])

  return (
    <div className="flex min-h-screen bg-[#070b10] text-slate-100">

      {/* SIDEBAR */}
      <aside className="group fixed lg:static inset-y-0 left-0 z-40 w-16 lg:w-16 hover:w-64 lg:hover:w-64 transition-[width,box-shadow] duration-300
        bg-gradient-to-b from-[#0c1218] via-[#0c151f] to-[#071019] text-white shadow-[0_25px_70px_-40px_rgba(16,185,129,0.5)] overflow-hidden
        rounded-r-[28px] lg:rounded-[32px] lg:my-5 lg:ml-5 lg:h-[calc(100vh-2.5rem)] border border-white/5">

        <div className="px-3 py-6 border-b border-white/10">
          <Logo
            textClassName="text-white inline-block opacity-0 max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[10rem] group-hover:opacity-100 transition-all duration-300"
            containerClassName="justify-center group-hover:justify-start gap-2"
            markClassName="shadow-[0_12px_24px_-10px_rgba(34,211,238,0.7)]"
          />
        </div>

        <nav className="p-3 space-y-3">
          {nav.map(n => {
            const active = n.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(n.path)
            return (
              <Link
                key={n.path}
                to={n.path}
                className={`group/nav relative flex items-center justify-center group-hover:justify-start gap-3 px-3 py-3 rounded-2xl transition-all duration-200
                  ${active
                    ? "text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <span
                  className={`absolute left-2 h-6 w-1 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                    active
                      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                      : "bg-transparent group-hover/nav:bg-emerald-200"
                  }`}
                />
                <span
                  className={`flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-200 text-slate-100 ${
                    active
                      ? "bg-white/15 text-white shadow-[0_0_18px_rgba(52,211,153,0.25)]"
                      : "bg-white/5 group-hover/nav:bg-white/10 group-hover/nav:text-white"
                  }`}
                >
                  <n.icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      active ? "scale-105" : "group-hover/nav:scale-105"
                    }`}
                  />
                </span>
                <span className="inline-block whitespace-nowrap opacity-0 max-w-0 overflow-hidden group-hover:max-w-[12rem] group-hover:opacity-100 transition-all duration-300">
                  {n.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto p-3 border-t border-white/10">
          <Link 
            to="/profile"
            className="flex items-center gap-3 mb-4 justify-center group-hover:justify-start transition-all hover:bg-white/5 rounded-xl p-1 -m-1"
          >
            {avatar ? (
              <img 
                src={avatar} 
                alt={name} 
                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white shadow-[0_0_16px_rgba(148,163,184,0.25)]">
                {name[0]}
              </div>
            )}
            <div className="opacity-0 max-w-0 overflow-hidden group-hover:max-w-[10rem] group-hover:opacity-100 transition-all duration-300">
              <p className="text-sm text-white">{name}</p>
              <p className="text-xs text-slate-400">User</p>
            </div>
          </Link>

          <button
            onClick={() => {
              localStorage.removeItem("access_token")
              navigate("/login")
            }}
            className="w-full flex items-center justify-center group-hover:justify-start gap-3 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="inline-block opacity-0 max-w-0 overflow-hidden group-hover:max-w-[6rem] group-hover:opacity-100 transition-all duration-300">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col ml-16 lg:ml-0">
        <header className="sticky top-0 z-30 px-6 py-4 border-b border-white/10 flex items-center gap-4 bg-[#0a1016]/80 backdrop-blur-2xl">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            System Online
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden md:block">
              <div className="group flex items-center gap-2 h-10 w-72 rounded-full bg-white/5 border border-white/10 px-4 text-sm text-slate-200 focus-within:border-emerald-300/60 focus-within:ring-2 focus-within:ring-emerald-300/20 transition">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search or jump to"
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
                <span className="text-[10px] text-slate-500 border border-white/10 rounded-md px-2 py-0.5">⌘K</span>
              </div>
            </div>

            <div className="relative">
              <button
                className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(v => !v)}
                title="Notifications"
              >
                <Bell className="w-4 h-4 mx-auto text-slate-200" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] rounded-full bg-emerald-400 text-[10px] text-slate-900 font-semibold flex items-center justify-center px-1 shadow-[0_0_12px_rgba(52,211,153,0.7)]">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-[#0b121a]/95 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(15,23,42,0.8)] p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-slate-100">Notifications</p>
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                    </div>
                    <div className="space-y-3">
                      {notifications.map(note => (
                        <div
                          key={note.id}
                          className={`rounded-xl border px-3 py-2 text-xs ${
                            note.unread
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-50"
                              : "border-white/10 bg-white/5 text-slate-300"
                          }`}
                        >
                          <p className="text-sm text-slate-100">{note.title}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{note.time}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              <Moon className="w-4 h-4 mx-auto text-slate-200" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 h-10 rounded-full border border-white/10 bg-white/5 px-2 pr-3 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt={name} 
                    className="h-8 w-8 rounded-full object-cover border border-emerald-400/30"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-300/60 to-cyan-300/60 text-slate-900 flex items-center justify-center text-xs font-semibold">
                    {name[0]}
                  </div>
                )}
                <span className="hidden lg:inline text-sm text-slate-200">{name}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-52 rounded-2xl border border-white/10 bg-[#0b121a]/95 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(15,23,42,0.8)] p-2"
                  >
                    <Link 
                      to="/profile"
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5 transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        localStorage.removeItem("access_token")
                        navigate("/login")
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
