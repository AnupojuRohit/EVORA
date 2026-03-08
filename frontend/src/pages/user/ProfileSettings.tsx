import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Phone,
  Car,
  Save,
  Bell,
  BellRing,
  Moon,
  Sun,
  Shield,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AvatarUploader from "@/components/AvatarUploader"
import { carAPI } from "@/lib/api"

interface UserProfile {
  name: string
  email: string
  phone: string
  preferredVehicleId: string | null
}

interface SettingsToggle {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  enabled: boolean
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    preferredVehicleId: null,
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  const [settings, setSettings] = useState<SettingsToggle[]>([
    {
      id: "notifications",
      label: "Push Notifications",
      description: "Receive booking updates and offers",
      icon: <Bell className="w-5 h-5" />,
      enabled: true,
    },
    {
      id: "arrival_reminders",
      label: "Arrival Reminders",
      description: "Get reminded 15 minutes before your slot",
      icon: <BellRing className="w-5 h-5" />,
      enabled: true,
    },
    {
      id: "dark_mode",
      label: "Dark Mode",
      description: "Use dark theme for the interface",
      icon: isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
      enabled: isDarkMode,
    },
    {
      id: "enhanced_security",
      label: "Enhanced Security",
      description: "Require PIN for sensitive actions",
      icon: <Shield className="w-5 h-5" />,
      enabled: false,
    },
  ])

  // Load profile from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem("evora_profile")
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    } else {
      // Get from auth if available
      const authUser = localStorage.getItem("evora_user")
      if (authUser) {
        const parsed = JSON.parse(authUser)
        setProfile((prev) => ({
          ...prev,
          name: parsed.name || "",
          email: parsed.email || "",
        }))
      }
    }

    // Load avatar
    const savedAvatar = localStorage.getItem("evora_avatar")
    if (savedAvatar) {
      setAvatarUrl(savedAvatar)
    }

    // Load settings
    const savedSettings = localStorage.getItem("evora_settings")
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings((prev) =>
        prev.map((s) => ({
          ...s,
          enabled: parsed[s.id] ?? s.enabled,
        }))
      )
    }
  }, [])

  // Load vehicles
  useEffect(() => {
    carAPI.getCars().then((res) => {
      setVehicles(res.data || [])
    })
  }, [])

  const handleAvatarChange = (url: string | null) => {
    setAvatarUrl(url)
    // Dispatch custom event for global avatar update
    window.dispatchEvent(new CustomEvent("avatarUpdate", { detail: url }))
  }

  const handleSettingToggle = (id: string) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    )

    // Handle dark mode toggle
    if (id === "dark_mode") {
      setIsDarkMode((prev) => !prev)
    }

    // Save to localStorage
    const newSettings = settings.reduce(
      (acc, s) => ({
        ...acc,
        [s.id]: s.id === id ? !s.enabled : s.enabled,
      }),
      {}
    )
    localStorage.setItem("evora_settings", JSON.stringify(newSettings))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Save to localStorage
      localStorage.setItem("evora_profile", JSON.stringify(profile))

      // Update auth user name if changed
      const authUser = localStorage.getItem("evora_user")
      if (authUser) {
        const parsed = JSON.parse(authUser)
        parsed.name = profile.name
        parsed.email = profile.email
        localStorage.setItem("evora_user", JSON.stringify(parsed))
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-6 lg:p-10 space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-200 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-white/60 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Profile Information
            </h2>
          </div>

          <div className="p-6 lg:p-8">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <AvatarUploader
                currentImage={avatarUrl}
                onImageChange={handleAvatarChange}
                size="lg"
                userName={profile.name}
              />
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-semibold text-white">
                  {profile.name || "Your Name"}
                </h3>
                <p className="text-white/50 text-sm">{profile.email || "email@example.com"}</p>
                <p className="text-xs text-emerald-400 mt-2">
                  Click avatar to upload a new photo
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter your name"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter your email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+91 9876543210"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Preferred Vehicle
                </label>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <select
                    value={profile.preferredVehicleId || ""}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        preferredVehicleId: e.target.value || null,
                      }))
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0a1016]">
                      Select preferred vehicle
                    </option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id} className="bg-[#0a1016]">
                        {v.brand} {v.model} ({v.car_number})
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 rotate-90" />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold flex items-center gap-2 hover:from-emerald-400 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </motion.button>

              {saveSuccess && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-emerald-400 text-sm"
                >
                  Profile updated successfully
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              Preferences
            </h2>
          </div>

          <div className="divide-y divide-white/5">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="p-6 lg:px-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      setting.enabled
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/5 text-white/40"
                    } transition-colors`}
                  >
                    {setting.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{setting.label}</h3>
                    <p className="text-sm text-white/50">{setting.description}</p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSettingToggle(setting.id)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    setting.enabled ? "bg-emerald-500" : "bg-white/10"
                  }`}
                >
                  <motion.div
                    layout
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md ${
                      setting.enabled ? "left-7" : "left-1"
                    }`}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Account</h2>
          </div>

          <div className="p-6 lg:p-8 space-y-4">
            <button className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors flex items-center justify-between">
              <span className="text-white">Export My Data</span>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </button>
            <button className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left hover:bg-red-500/20 transition-colors flex items-center justify-between">
              <span className="text-red-400">Delete Account</span>
              <ChevronRight className="w-4 h-4 text-red-400/60" />
            </button>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
