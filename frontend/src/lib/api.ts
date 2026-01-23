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

  deleteCar: (id: string) => api.delete(`/cars/${id}`),
};

// Booking endpoints
export const bookingAPI = {
  getBookings: () => api.get('/bookings'),
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
}

export default api;
