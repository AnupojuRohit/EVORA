import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

interface VehicleHeroCardProps {
  vehicle: any
}

const VehicleHeroCard = ({ vehicle }: VehicleHeroCardProps) => {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/[0.06] border border-white/10 p-8">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[420px] h-[420px] bg-emerald-500/20 blur-[120px]" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* LEFT */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-white/50">Your Vehicle</p>
            <h2 className="text-2xl font-semibold mt-1">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="text-sm text-white/60 mt-1 font-mono">
              {vehicle.car_number}
            </p>
          </div>

          {/* CTA — FIXED */}
          <div className="flex gap-4 pt-4">

            {/* ✅ BOOK SLOT — NOW VISIBLE + REDIRECT */}
            <button
              onClick={() => navigate("/dashboard/bookings")}
              className="
               px-6 py-3 rounded-xl
                bg-white/15 text-white
            
                  hover:bg-emerald-400
                transition
              "
            >
              Book Slot
            </button>

            {/* VIEW DETAILS */}
            <button
              onClick={() => navigate("/dashboard/vehicles")}
              className="
                px-6 py-3 rounded-xl
                bg-white/15 text-white
            
                  hover:bg-emerald-400
                transition
              "
            >
              View Details
            </button>
          </div>
        </div>

        {/* RIGHT — ANIMATED CAR */}
        <div className="relative flex items-center justify-center">
          <motion.img
            src="/car.jpg"
            alt="EV Car"
            className="w-[340px] select-none"
            animate={{ y: [0, -12, 0], rotate: [-1, 1, -1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="absolute bottom-2 w-64 h-8 bg-emerald-500/30 blur-2xl rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default VehicleHeroCard
