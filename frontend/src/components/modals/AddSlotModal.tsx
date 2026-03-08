import { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { slotAPI, chargerAPI } from '../../lib/api';

interface AddSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationId: string | null;
  onSuccess?: () => void;
}

const AddSlotModal = ({ isOpen, onClose, stationId, onSuccess }: AddSlotModalProps) => {
  const [loading, setLoading] = useState(false);
  const [chargers, setChargers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    charger_id: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !stationId) return;
      try {
        const res = await chargerAPI.getChargers(stationId);
        setChargers(res.data);
        if (res.data.length > 0) {
          setFormData((f) => ({ ...f, charger_id: res.data[0].id }));
        }
      } catch {
        setChargers([]);
      }
    };
    load();
  }, [isOpen, stationId]);

  if (!isOpen || !stationId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await slotAPI.addSlot(stationId, {
        charger_id: formData.charger_id,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });
      onSuccess?.();
      onClose();
      setFormData({ charger_id: '', start_time: '', end_time: '' });
    } catch (error) {
      console.error('Failed to add slot:', error);
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
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-lg text-foreground">Add Time Slot</h2>
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
              Charger
            </label>
            <select
              value={formData.charger_id}
              onChange={(e) => setFormData({ ...formData, charger_id: e.target.value })}
              className="input-clean cursor-pointer"
              required
            >
              {chargers.map((c) => (
                <option key={c.id} value={c.id}>{c.charger_type} • {c.power_kw}kW</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="input-clean cursor-pointer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              End Time
            </label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="input-clean cursor-pointer"
              required
            />
          </div>

          <div className="p-4 rounded-xl bg-accent/50 border border-primary/10">
            <p className="text-sm text-muted-foreground">
              Tip: Create multiple 1-hour slots for better booking flexibility.
            </p>
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
              {loading ? <LoadingSpinner size="sm" /> : 'Add Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSlotModal;
