export default function VehicleDetailsView({ vehicle, details, onEdit }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">
          {vehicle.brand} {vehicle.model}
        </h2>

        <p className="text-white/70">
          Car Number: {vehicle.car_number}
        </p>

        <p className="text-white/70">
          Charger Type: {vehicle.charger_type}
        </p>

        <p className="text-white/70">
          Purchase Date: {details?.purchaseDate || "Not set"}
        </p>

        <p className="text-white/70">
          Dealer: {details?.dealer || "Not set"}
        </p>

        <button
          onClick={onEdit}
          className="mt-4 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          Edit Details
        </button>
      </div>

      <img
        src="/car.jpg"
        className="rounded-xl w-full max-w-sm"
      />
    </div>
  )
}
