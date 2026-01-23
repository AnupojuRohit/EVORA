import { useState , useEffect} from 'react';
import { Car, CheckCircle ,Trash2  } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import { carAPI } from '../../lib/api';

/* ---------------------------------------
   Types
---------------------------------------- */
interface Vehicle {
  id: string;
  brand: string;
  model: string;
  chargerType: string;
  carNumber: string;
}


/* ---------------------------------------
   Vehicle Catalog (TEMP)
---------------------------------------- */
const CAR_CATALOG: Record<string, Record<string, string>> = {
  Tata: {
    'Nexon EV': 'CCS2',
    'Tiago EV': 'CCS2',
  },
  MG: {
    'ZS EV': 'CCS2',
  },
  Tesla: {
    'Model 3': 'Type 2',
    'Model Y': 'Type 2',
  },
  Hyundai: {
    'Kona Electric': 'CCS2',
  },
};



const MyVehicles = () => {
 const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  /* ---------------------------------------
     Add Vehicle Form
  ---------------------------------------- */
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await carAPI.getCars();
        setVehicles(
          res.data.map((c: any) => ({
            id: c.id,
            brand: c.brand,
            model: c.model,
            chargerType: c.charger_type,
            carNumber: c.car_number,
          }))
        );
      } catch (err) {
        console.error('Failed to load vehicles', err);
      }
    };

    fetchVehicles();
  }, []);

  
  

  const availableModels = brand ? Object.keys(CAR_CATALOG[brand]) : [];
  const chargerType = brand && model ? CAR_CATALOG[brand][model] : '';

  const handleDeleteVehicle = async (id: string) => {
  try {
    await carAPI.deleteCar(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  } catch (err) {
    console.error('Failed to delete vehicle', err);
  }
};

  const handleAddVehicle = async () => {
  if (!brand || !model || !carNumber) return;

  try {
    const res = await carAPI.addCar({
      brand,
      model,
      car_number: carNumber,
      charger_type: chargerType,
    });

    setVehicles((prev) => [
      ...prev,
      {
        id: res.data.id,
        brand: res.data.brand,
        model: res.data.model,
        chargerType: res.data.charger_type,
        carNumber: res.data.car_number,
      },
    ]);

    setBrand('');
    setModel('');
    setCarNumber('');

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  } catch (err) {
    console.error('Failed to add vehicle', err);
  }
};

  return (
    <DashboardLayout userType="user">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* ---------------------------------------
           EXISTING VEHICLES (TOP CARD)
        ---------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h1 className="text-xl font-semibold text-foreground mb-4">
            My Vehicles
          </h1>

          {vehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No vehicles added"
              description="Add your EV below to start booking charging slots"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                   className="relative p-4 rounded-xl bg-muted/50 hover:bg-muted transition"
                > 
                      {/* Delete Button – CENTER RIGHT */}
  <div className="absolute inset-y-0 right-5 flex items-center">
    <button
      onClick={() => handleDeleteVehicle(v.id)}
      className="text-muted-foreground hover:text-destructive transition"
      title="Delete vehicle"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
                
                  <p className="font-medium text-foreground">
                {v.brand} {v.model}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
                {v.carNumber}
            </p>
            <span className="inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                {v.chargerType}
            </span>
            </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------------------------------------
           DIVIDER WITH OR
        ---------------------------------------- */}
        <div className="relative flex items-center justify-center">
          <div className="w-full h-px bg-border" />
          <span className="absolute px-4 py-1 text-sm font-medium bg-background text-muted-foreground rounded-full border">
            OR
          </span>
        </div>

        {/* ---------------------------------------
           ADD VEHICLE (INLINE FORM)
        ---------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">
            Add a New Vehicle
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Brand */}
            <select
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setModel('');
              }}
              className="p-3 rounded-lg border"
            >
              <option value="">Select Brand</option>
              {Object.keys(CAR_CATALOG).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Model */}
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!brand}
              className="p-3 rounded-lg border disabled:opacity-50"
            >
              <option value="">Select Model</option>
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Charger Type */}
            <input
              type="text"
              value={chargerType}
              disabled
              placeholder="Charger Type"
              className="p-3 rounded-lg border bg-muted"
            />

            {/* Car Number */}
            <input
              type="text"
              placeholder="Car Number (e.g. MH12AB1234)"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
              className="p-3 rounded-lg border"
            />
          </div>

          <button
            onClick={handleAddVehicle}
            disabled={!brand || !model || !carNumber}
            className="w-full mt-4 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            Save Vehicle
          </button>
        </div>
      </div>

      {/* ---------------------------------------
         SUCCESS TOAST
      ---------------------------------------- */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>Vehicle saved successfully</span>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyVehicles;
