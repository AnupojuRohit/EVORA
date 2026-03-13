import axios from 'axios';

// Configure base URL - can be changed for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  googleAuth: () => api.get('/auth/google'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),
  me: () => api.get('/users/me'),
};

// Admin auth endpoints
export const adminAuthAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/admin/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/admin/login', data),
};

// Car endpoints
export const carAPI = {
  getCars: () => api.get('/cars'),

  addCar: (data: {
    brand: string;
    model: string;
    car_number: string;
    charger_type: string;
  }) => api.post('/cars', data),

  updateCar: (id: string, data: {
    brand?: string;
    model?: string;
    car_number?: string;
    charger_type?: string;
    purchase_date?: string | null;
    purchase_city?: string | null;
  }) => api.patch(`/cars/${id}`, data),

  deleteCar: (id: string) => api.delete(`/cars/${id}`),
};

// Booking endpoints
export const bookingAPI = {
  getBookings: () => api.get('/bookings'),
  getBookingById: (bookingId: string) => api.get(`/bookings/${bookingId}`),
  createBooking: (data: {
    car_id: string
    station_id: string
    slot_id: string
    order_id: string
    transaction_id: string
    amount: number
  }) => api.post("/bookings", data),

  getMyBookings: () => api.get("/bookings"),
  startBooking: (data: { ticket_id: string; car_id?: string }) => api.post('/bookings/start', data),

  // Emergency booking request (user side)
  createEmergencyRequest: (data: {
    station_id: string
    vehicle_number: string
    car_id?: string
    charger_type?: string
    estimated_duration?: number
    notes?: string
  }) => api.post('/bookings/emergency-request', data),

  // Walk-in booking (admin side)
  createWalkInBooking: (data: {
    vehicle_number: string
    user_name?: string
    user_phone?: string
    station_id: string
    charger_id: string
    slot_id: string
    is_emergency?: boolean
    amount: number
  }) => api.post('/bookings/walk-in', data),

  // Approve emergency request (admin)
  approveEmergency: (bookingId: string, data: { slot_id: string; amount: number }) =>
    api.post(`/bookings/approve-emergency/${bookingId}`, data),

  // Verify booking by identifier
  verifyBooking: (identifier: string, searchType: 'vehicle_number' | 'ticket_id' | 'booking_id') =>
    api.get('/bookings/verify', { params: { identifier, search_type: searchType } }),

  // Confirm arrival manually
  confirmArrival: (bookingId: string) => api.post(`/bookings/confirm-arrival/${bookingId}`),

  // Start charging manually
  startCharging: (bookingId: string) => api.post(`/bookings/start-charging/${bookingId}`),

  // Get all bookings (admin)
  getAllBookings: () => api.get('/bookings/all'),
}

// Station endpoints (admin)
export const stationAPI = {
  getStations: () => api.get('/stations'),
  getStationById: (stationId: string) => api.get(`/stations/${stationId}`),
  addStation: (data: { name: string; address: string; latitude: string | number; longitude: string | number; host_id?: string }) =>
    api.post('/stations', {
      ...data,
      host_id: data.host_id ?? 'admin-host-id',
      latitude: String(data.latitude),
      longitude: String(data.longitude),
    }),
  updateStation: (stationId: string, data: Partial<{ name: string; address: string; latitude: string; longitude: string; is_active: boolean }>) =>
    api.put(`/stations/${stationId}`, data),
  deleteStation: (id: string) => api.delete(`/stations/${id}`),

  // nearby stations
  getNearbyStations: (lat: number, lng: number) =>
    api.get(`/stations/nearby?lat=${lat}&lng=${lng}`),
  // read-only availability
  getAvailability: (stationId: string) =>
    api.get(`/stations/${stationId}/availability`),

  // Admin helpers
  getChargersWithSlots: (stationId: string) => api.get(`/stations/${stationId}/chargers-with-slots`),
};

// Charger endpoints (admin)
export const chargerAPI = {
  getChargers: (stationId: string) => api.get(`/stations/${stationId}/chargers`),
  addCharger: (stationId: string, data: { charger_type: string; power_kw: number; price_per_hour?: number }) =>
    api.post(`/stations/${stationId}/chargers`, data),
  deleteCharger: (chargerId: string) => api.delete(`/stations/chargers/${chargerId}`),
};

// Slot endpoints (admin)
export const slotAPI = {
  // User-side: fetch slots for a station
  getSlots: (stationId: string) =>
    api.get(`/stations/${stationId}/slots`),

  // Admin-side: add slot to a station
  addSlot: (
    stationId: string,
    data: {
      charger_id: string
      start_time: string
      end_time: string
    }
  ) =>
    api.post(`/stations/${stationId}/slots`, data),

  // Admin-side: view all slots with booking + user + car info
  getAdminSlots: () =>
    api.get(`/slots/admin/slots`),

  // Count available slots for a station
  getAvailableCount: (stationId: string) => api.get(`/slots/count`, { params: { station_id: stationId } }),

  // Reset a slot to make it available again
  resetSlot: (slotId: string) => api.post(`/slots/reset/${slotId}`),

  // Reset all slots for a station
  resetStationSlots: (stationId: string) => api.post(`/slots/reset-station/${stationId}`),

  // Generate new slots for a charger
  generateSlots: (chargerId: string) => api.post(`/slots/generate/${chargerId}`),

  // Generate new slots for ALL chargers in a station
  generateSlotsForStation: (stationId: string) => api.post(`/slots/generate-for-station/${stationId}`),

  // Toggle emergency reserved status for a slot
  toggleEmergencyReserved: (slotId: string, isEmergencyReserved: boolean) =>
    api.patch(`/slots/${slotId}/emergency-reserved`, { is_emergency_reserved: isEmergencyReserved }),
}

export default api;
