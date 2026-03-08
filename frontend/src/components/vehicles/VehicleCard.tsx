import { Trash2 } from "lucide-react"
import AddVehicleSheet from "../../components/vehicles/AddVehicleSheet"
interface Props {
  brand: string
  model: string
  carNumber: string
  chargerType: string
  onDelete: () => void
  onView: () => void
}

export default function VehicleCard({
  brand,
  model,
  carNumber,
  chargerType,
  onDelete,
  onView,
}: Props) {
  return (
    <div className="relative rounded-2xl bg-white/[0.06] border border-white/10 p-6">

      <button
        onClick={onDelete}
        className="absolute top-4 right-4 text-white/40 hover:text-red-400"
      >
        🗑
      </button>

      <h3 className="text-lg font-semibold">
        {brand} {model}
      </h3>

      <p className="text-sm text-white/50 mt-1">{carNumber}</p>

      <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
        {chargerType}
      </span>

      {/* ✅ ONLY ONE BUTTON */}
      <button
        onClick={onView}
        className="w-full mt-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
      >
        View Details
      </button>
    </div>
  )
}
