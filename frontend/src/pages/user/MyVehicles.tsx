import { useEffect, useState } from "react"
import { Plus, Pencil, Save, X } from "lucide-react"
import { carAPI } from "../../lib/api"
import AddVehicleSheet from "../../components/vehicles/AddVehicleSheet"
import { VEHICLE_CATALOG } from "@/data/vehicleCatalog"


export default function MyVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const [activeVehicle, setActiveVehicle] = useState<any | null>(null)
  const [editMode, setEditMode] = useState(false)

  const [form, setForm] = useState({
    purchase_date: "",
    purchase_city: "",
  })

  /* LOAD VEHICLES */
  useEffect(() => {
    carAPI.getCars().then(res => setVehicles(res.data))
  }, [])

  /* OPEN DETAILS */
  const openDetails = (v: any) => {
    setActiveVehicle(v)
    setEditMode(!v.purchase_date && !v.purchase_city)

    setForm({
      purchase_date: v.purchase_date || "",
      purchase_city: v.purchase_city || "",
    })
  }

  /* SAVE DETAILS */
  const saveDetails = async () => {
    if (!activeVehicle) return

    try {
      const payload = {
        purchase_date: form.purchase_date || null,
        purchase_city: form.purchase_city || null,
      }

      const res = await carAPI.updateCar(activeVehicle.id, payload)

      setVehicles(vs =>
        vs.map(v => (v.id === activeVehicle.id ? res.data : v))
      )

      setActiveVehicle(res.data)
      setEditMode(false)
    } catch (err) {
      console.error("SAVE FAILED:", err)
      alert("Failed to save vehicle details")
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Vehicles</h1>
          <p className="text-white/50 text-sm">Manage your EVs</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 text-black font-medium"
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {/* VEHICLE LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehicles.map(v => (
          <div
            key={v.id}
            className="rounded-2xl bg-white/5 border border-white/10 p-6"
          >
            <h3 className="text-lg font-medium">
              {v.brand} {v.model}
            </h3>
            <p className="text-white/50 text-sm">{v.car_number}</p>
            <span className="text-xs text-emerald-400">
              {v.charger_type}
            </span>

            <button
              onClick={() => openDetails(v)}
              className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/15"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* DETAILS PANEL */}
      {activeVehicle && (
        <div className="rounded-3xl bg-white/5 border border-white/10 p-10 grid md:grid-cols-2 gap-10">

          {/* LEFT */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {activeVehicle.brand} {activeVehicle.model}
            </h2>

            {!editMode ? (
              <>
                <p>Car Number: {activeVehicle.car_number}</p>
                <p>Charger Type: {activeVehicle.charger_type}</p>
                <p>Purchase Date: {activeVehicle.purchase_date || "Not set"}</p>
                <p>Purchase City: {activeVehicle.purchase_city || "Not set"}</p>

                <button
                  onClick={() => setEditMode(true)}
                  className="mt-4 px-4 py-2 rounded-lg bg-white/10"
                >
                  <Pencil size={14} /> Edit Details
                </button>
              </>
            ) : (
              <>
                <input
                  type="date"
                  value={form.purchase_date}
                  onChange={e =>
                    setForm({ ...form, purchase_date: e.target.value })
                  }
                  className="w-full p-2 rounded bg-black/40 border border-white/10"
                />

                <input
                  placeholder="Purchase City"
                  value={form.purchase_city}
                  onChange={e =>
                    setForm({ ...form, purchase_city: e.target.value })
                  }
                  className="w-full p-2 rounded bg-black/40 border border-white/10"
                />

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveDetails}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg
                               bg-emerald-500 text-black font-medium hover:bg-emerald-400"
                  >
                    <Save size={16} />
                    Save
                  </button>

                  <button
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg
                               bg-white/10 hover:bg-white/15"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT IMAGE */}
          <img
            src="/car.jpg"
            alt="vehicle"
            className="rounded-2xl w-full object-cover"
          />
        </div>
      )}

      <AddVehicleSheet
        open={open}
        onClose={() => setOpen(false)}
        onSave={async (data) => {
          try {
            await carAPI.addCar({
              brand: data.brand,
              model: data.model,
              car_number: data.carNumber,
              charger_type: data.chargerType,
            })
            // Refresh vehicle list
            const res = await carAPI.getCars()
            setVehicles(res.data)
          } catch (err) {
            console.error("Failed to add vehicle:", err)
            alert("Failed to add vehicle")
          }
        }}
        catalog={VEHICLE_CATALOG}

      />
    </div>
  )
}
