
export interface User {
  email: string;
}

export interface PhotoMetadata {
    downloadURL: string;
    path: string; // The path in Firebase Storage (optional but useful)
    fileName: string; // Original file name
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
  photos: PhotoMetadata[]; 
  serviceHistoryPhotos: PhotoMetadata[];
  description: string;
  createdAt: string; // ISO 8601 date string
}

