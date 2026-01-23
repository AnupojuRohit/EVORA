import { useState } from 'react';
import { X, Car } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { carAPI } from '../../lib/api';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const chargerTypes = [
  'Type 1 (J1772)',
  'Type 2 (Mennekes)',
  'CCS1',
  'CCS2',
  'CHAdeMO',
  'Tesla Supercharger',
];

const AddCarModal = ({ isOpen, onClose, onSuccess }: AddCarModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    car_number: '',
    brand: '',
    model: '',
    charger_type: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await carAPI.addCar(formData);
      onSuccess?.();
      onClose();
      setFormData({ car_number: '', brand: '', model: '', charger_type: '' });
    } catch (error) {
      console.error('Failed to add car:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-elevated animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-lg text-foreground">Add New Vehicle</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Vehicle Number
            </label>
            <input
              type="text"
              value={formData.car_number}
              onChange={(e) => setFormData({ ...formData, car_number: e.target.value })}
              className="input-clean"
              placeholder="MH12AB1234"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="input-clean"
                placeholder="Tesla"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="input-clean"
                placeholder="Model 3"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Charger Type
            </label>
            <select
              value={formData.charger_type}
              onChange={(e) => setFormData({ ...formData, charger_type: e.target.value })}
              className="input-clean cursor-pointer"
              required
            >
              <option value="">Select charger type</option>
              {chargerTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCarModal;
