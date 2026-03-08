import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { chargerAPI } from '../../lib/api';

interface AddChargerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationId: string | null;
  onSuccess?: () => void;
}

const chargerTypes = [
  { value: 'type1', label: 'Type 1 (J1772)' },
  { value: 'type2', label: 'Type 2 (Mennekes)' },
  { value: 'ccs1', label: 'CCS1' },
  { value: 'ccs2', label: 'CCS2' },
  { value: 'chademo', label: 'CHAdeMO' },
  { value: 'tesla', label: 'Tesla Supercharger' },
];

const powerOptions = [
  { value: 7, label: '7 kW (AC Slow)' },
  { value: 22, label: '22 kW (AC Fast)' },
  { value: 50, label: '50 kW (DC Fast)' },
  { value: 150, label: '150 kW (DC Rapid)' },
  { value: 350, label: '350 kW (DC Ultra-Fast)' },
];

const AddChargerModal = ({ isOpen, onClose, stationId, onSuccess }: AddChargerModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    charger_type: '',
    power_kw: '',
  });

  if (!isOpen || !stationId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await chargerAPI.addCharger(stationId, {
        charger_type: formData.charger_type,
        power_kw: parseFloat(formData.power_kw),
      });
      onSuccess?.();
      onClose();
      setFormData({ charger_type: '', power_kw: '' });
    } catch (error) {
      console.error('Failed to add charger:', error);
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
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-lg text-foreground">Add Charger</h2>
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
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Power Capacity
            </label>
            <select
              value={formData.power_kw}
              onChange={(e) => setFormData({ ...formData, power_kw: e.target.value })}
              className="input-clean cursor-pointer"
              required
            >
              <option value="">Select power capacity</option>
              {powerOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
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
              {loading ? <LoadingSpinner size="sm" /> : 'Add Charger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChargerModal;
