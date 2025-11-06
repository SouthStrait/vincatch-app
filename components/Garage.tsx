import React from 'react';
import { Vehicle } from '../types';
import CarIcon from './icons/CarIcon';

interface GarageProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicleId: string) => void;
  onNavigateHome: () => void;
}

const Garage: React.FC<GarageProps> = ({ vehicles, onSelectVehicle, onNavigateHome }) => {
  return (
    <div className="bg-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-800 animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-bold text-white">My Garage</h2>
        <button
            onClick={onNavigateHome}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
            Home
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
            <CarIcon />
            <p className="mt-4 text-lg text-neutral-400">Your garage is empty.</p>
            <p className="text-sm text-neutral-500">Add a vehicle to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map(vehicle => {
                const firstPhoto = vehicle.photos.find(p => p !== null);
                return (
                    <div 
                        key={vehicle.id} 
                        className="bg-gray-950/50 rounded-lg border border-gray-800 overflow-hidden cursor-pointer group transition-all duration-300 hover:border-orange-500 hover:scale-105"
                        onClick={() => onSelectVehicle(vehicle.id)}
                    >
                        {firstPhoto ? (
                             <img 
                                src={firstPhoto} 
                                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                className="w-full h-48 object-cover"
                            />
                        ) : (
                            <div className="w-full h-48 bg-gray-900 flex items-center justify-center">
                                <CarIcon />
                            </div>
                        )}
                       
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-neutral-200">{vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}</h3>
                            <p className="text-sm text-neutral-400 truncate">{(vehicle.trimLevel || 'N/A').toUpperCase()}</p>
                            <p className="text-xs text-neutral-500 mt-2">VIN: {vehicle.vin.toUpperCase()}</p>
                        </div>
                    </div>
                )
            })}
        </div>
      )}
    </div>
  );
};

export default Garage;