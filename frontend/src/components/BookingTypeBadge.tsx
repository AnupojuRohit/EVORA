import { AlertTriangle, Zap, Users, Clock } from "lucide-react"

export type BookingType = "standard" | "emergency" | "walk_in" | "emergency_requested"

interface BookingTypeBadgeProps {
  type: BookingType
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

const badgeConfig = {
  standard: {
    label: "Standard",
    bgClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-300",
    icon: Zap,
  },
  emergency: {
    label: "Emergency",
    bgClass: "bg-amber-500/20",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-300",
    icon: AlertTriangle,
  },
  walk_in: {
    label: "Walk-In",
    bgClass: "bg-cyan-500/20",
    borderClass: "border-cyan-500/30",
    textClass: "text-cyan-300",
    icon: Users,
  },
  emergency_requested: {
    label: "Pending Approval",
    bgClass: "bg-orange-500/20",
    borderClass: "border-orange-500/30",
    textClass: "text-orange-300",
    icon: Clock,
  },
}

const sizeConfig = {
  sm: {
    padding: "px-2 py-0.5",
    text: "text-[10px]",
    iconSize: "w-3 h-3",
    gap: "gap-1",
  },
  md: {
    padding: "px-2.5 py-1",
    text: "text-xs",
    iconSize: "w-3.5 h-3.5",
    gap: "gap-1.5",
  },
  lg: {
    padding: "px-3 py-1.5",
    text: "text-sm",
    iconSize: "w-4 h-4",
    gap: "gap-2",
  },
}

export const BookingTypeBadge = ({
  type,
  size = "sm",
  showIcon = true,
}: BookingTypeBadgeProps) => {
  const config = badgeConfig[type] || badgeConfig.standard
  const sizes = sizeConfig[size]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center ${sizes.gap} ${sizes.padding} rounded-full border ${config.bgClass} ${config.borderClass} ${config.textClass} ${sizes.text} font-medium`}
    >
      {showIcon && <Icon className={sizes.iconSize} />}
      {config.label}
    </span>
  )
}

export default BookingTypeBadge
