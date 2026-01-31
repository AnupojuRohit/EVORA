import { ReactNode, useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Car,
  Calendar,
  Receipt,
  LogOut,
  Menu
} from "lucide-react"
import Logo from "../ui/Logo"
import { authAPI } from "../../lib/api"

const nav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Car, label: "My Cars", path: "/dashboard/vehicles" }, // ✅ FIXED
  { icon: Calendar, label: "Bookings", path: "/dashboard/bookings" },
  { icon: Receipt, label: "Transactions", path: "/dashboard/transactions" },
]

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [name, setName] = useState("User")

  useEffect(() => {
    authAPI.me().then(res => setName(res.data?.name || "User"))
  }, [])

  return (
    <div className="flex min-h-screen bg-[#05060a] text-white">

      {/* SIDEBAR */}
      <aside className="fixed lg:static inset-y-0 left-0 w-64
        bg-gradient-to-b from-[#0f111a] to-[#0b0b0d]
        border-r border-white/10">

        <div className="p-6 border-b border-white/10">
          <Logo />
        </div>

        <nav className="p-4 space-y-2">
          {nav.map(n => {
            const active = location.pathname.startsWith(n.path)
            return (
              <Link
                key={n.path}
                to={n.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl
                  ${active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5"}`}
              >
                <n.icon className="w-5 h-5" />
                {n.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              {name[0]}
            </div>
            <div>
              <p className="text-sm">{name}</p>
              <p className="text-xs text-white/50">User</p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("access_token")
              navigate("/login")
            }}
            className="flex items-center gap-3 text-white/60 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-white/10 flex items-center">
          <div className="ml-auto flex items-center gap-2 text-white/60 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            System Online
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
