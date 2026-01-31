
import { useState } from "react"
import { X } from "lucide-react"


interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: {
    brand: string
    model: string
    carNumber: string
    chargerType: string
  }) => void
  catalog: Record<string, Record<string, string>>
}

const AddVehicleSheet = ({ open, onClose, onSave, catalog }: Props) => {
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [carNumber, setCarNumber] = useState("")

  const models = brand ? Object.keys(catalog[brand]) : []
  const chargerType = brand && model ? catalog[brand][model] : ""

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-[420px]
        bg-[#0f111a] border-l border-white/10 p-6 space-y-6">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add New Vehicle</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white/60 hover:text-white" />
          </button>
        </div>

     <select
  className="
    w-full p-3 rounded-lg
    bg-[#141628] text-white
    border border-white/10
    focus:outline-none focus:ring-2 focus:ring-emerald-400
  "
  value={brand}
  onChange={e => {
    setBrand(e.target.value)
    setModel("")
  }}
>
  <option value="" className="bg-[#141628] text-white">
    Select Brand
  </option>
  {Object.keys(catalog).map(b => (
    <option
      key={b}
      value={b}
      className="bg-[#141628] text-white"
    >
      {b}
    </option>
  ))}
</select>


       <select
  disabled={!brand}
  className="
    w-full p-3 rounded-lg
    bg-[#141628] text-white
    border border-white/10
    disabled:opacity-50
    focus:outline-none focus:ring-2 focus:ring-emerald-400
  "
  value={model}
  onChange={e => setModel(e.target.value)}
>
  <option value="" className="bg-[#141628] text-white">
    Select Model
  </option>
  {models.map(m => (
    <option
      key={m}
      value={m}
      className="bg-[#141628] text-white"
    >
      {m}
    </option>
  ))}
</select>


        <input
          disabled
          value={chargerType}
          placeholder="Charger Type"
          className="w-full p-3 rounded-lg bg-white/5 border border-white/10"
        />
        

        <input
          value={carNumber}
          onChange={e => setCarNumber(e.target.value.toUpperCase())}
          placeholder="Car Number"
          className="w-full p-3 rounded-lg bg-white/5 border border-white/10"
        />

        <button
          onClick={() => {
            onSave({ brand, model, carNumber, chargerType })
            onClose()
          }}
          disabled={!brand || !model || !carNumber}
          className="w-full py-3 rounded-xl bg-emerald-400 text-black font-semibold disabled:opacity-40"
        >
          Save Vehicle
        </button>
      </div>
    </div>
  )
}

export default AddVehicleSheet
