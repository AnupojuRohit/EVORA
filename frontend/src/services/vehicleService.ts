import { carAPI } from '../lib/api';

export interface VehicleDTO {
  id: string;
  brand: string;
  model: string;
  charger_type: string;
  car_number: string;
}

export const vehicleService = {
  async getAll() {
    const res = await carAPI.getCars();
    return res.data as VehicleDTO[];
  },

  async create(data: {
    brand: string;
    model: string;
    charger_type: string;
    car_number: string;
  }) {
    const res = await carAPI.addCar(data);
    return res.data as VehicleDTO;
  },

  async remove(id: string) {
    await carAPI.deleteCar(id);
  },
};
