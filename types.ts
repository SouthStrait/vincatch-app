
export interface User {
  email: string;
}

export interface Vehicle {
  id: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  trimLevel: string;
  bodyStyle: string;
  size: string;
  province: string;
  mileage: string;
  mileageUnit: string;
  color: string;
  transmission: string;
  drivetrain: string;
  engineCylinders: string;
  displacement: string;
  fuelType: string;
  features: string[];
  serviceHistory: string;
  photos: (string | null)[]; // Array of base64 encoded image strings, nulls preserve slot index
  serviceHistoryPhotos: string[]; // Array of base64 encoded image strings for service records
  description: string;
  createdAt: string; // ISO 8601 date string
}