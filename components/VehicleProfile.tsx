import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import PhotoGallery from './PhotoGallery';
import CalendarIcon from './icons/CalendarIcon';
import GaugeIcon from './icons/GaugeIcon';
import CarIcon from './icons/CarIcon';
import WrenchIcon from './icons/WrenchIcon';
import PaletteIcon from './icons/PaletteIcon';
import MapPinIcon from './icons/MapPinIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import PencilIcon from './icons/PencilIcon';
import ClockIcon from './icons/ClockIcon';
import PencilSquareIcon from './icons/PencilSquareIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import FuelIcon from './icons/FuelIcon';

interface VehicleProfileProps {
  vehicle: Vehicle | Omit<Vehicle, 'createdAt'>;
  isNewProfile: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onBackToGarage: () => void;
  onUpdateDescription: (newDescription: string) => void;
  onEdit: (vehicleId: string) => void;
}

const recallSites: { [key: string]: string } = {
    'ford': 'https://www.ford.com/support/recalls-details/',
    'toyota': 'https://www.toyota.com/recall?vin={VIN}',
    'honda': 'https://owners.honda.com/service-maintenance/recalls?vin={VIN}',
    'chevrolet': 'https://www.chevrolet.com/ownercenter/recalls?vin={VIN}',
    'nissan': 'https://www.nissanusa.com/recalls.html?vin={VIN}',
    'jeep': 'https://www.mopar.com/en-us/my-vehicle/recalls/search.html?vin={VIN}',
    'hyundai': 'https://autoservice.hyundaiusa.com/campaignhome?vin={VIN}',
    'kia': 'https://owners.kia.com/us/en/recalls.html?vin={VIN}',
    'bmw': 'https://www.bmwusa.com/recall.html?vin={VIN}',
    'mercedes-benz': 'https://www.mbusa.com/en/recall?vin={VIN}',
    'volkswagen': 'https://www.vw.com/en/recalls.html?vin={VIN}',
    'audi': 'https://www.audiusa.com/us/web/en/compliance/recall.html?vin={VIN}',
    'subaru': 'https://www.subaru.com/recalls.html?vin={VIN}',
    'gmc': 'https://www.gmc.com/ownercenter/recalls?vin={VIN}',
    'ram': 'https://www.mopar.com/en-us/my-vehicle/recalls/search.html?vin={VIN}',
    'dodge': 'https://www.mopar.com/en-us/my-vehicle/recalls/search.html?vin={VIN}',
    'chrysler': 'https://www.mopar.com/en-us/my-vehicle/recalls/search.html?vin={VIN}',
    'lexus': 'https://www.lexus.com/recall?vin={VIN}',
    'acura': 'https://owners.acura.com/service-maintenance/recalls?vin={VIN}',
};
const nhtsaFallbackUrl = 'https://www.nhtsa.gov/recalls?vin={VIN}';

const getRecallUrl = (make: string, vin: string): string => {
    const lowerCaseMake = make.toLowerCase();
    const urlTemplate = recallSites[lowerCaseMake] || nhtsaFallbackUrl;
    return urlTemplate.replace('{VIN}', vin);
};


const VehicleProfile: React.FC<VehicleProfileProps> = ({ vehicle, isNewProfile, onSave, onDiscard, onBackToGarage, onUpdateDescription, onEdit }) => {
  const recallUrl = getRecallUrl(vehicle.make, vehicle.vin);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(vehicle.description);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);


  useEffect(() => {
    setEditedDescription(vehicle.description);
  }, [vehicle.description]);

  const handleSaveDescription = () => {
    onUpdateDescription(editedDescription);
    setIsEditingDescription(false);
  };

  const handleCancelEdit = () => {
    setEditedDescription(vehicle.description);
    setIsEditingDescription(false);
  };

  const engineDisplay = [
      vehicle.engineCylinders ? `${vehicle.engineCylinders} Cylinders` : null,
      vehicle.displacement ? `${vehicle.displacement}L` : null,
  ].filter(Boolean).join(' / ');
  
  return (
    <div className="bg-gray-900/50 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-800 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white">{`${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`}</h2>
                <p className="text-md text-neutral-400">VIN: {vehicle.vin.toUpperCase()}</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {isNewProfile ? (
                    <>
                        <button
                            onClick={onDiscard}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                        >
                            Discard
                        </button>
                        <button
                            onClick={onSave}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                        >
                            Save to Garage
                        </button>
                    </>
                ) : (
                    <>
                      <button
                          onClick={onBackToGarage}
                          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                      >
                          Back to Garage
                      </button>
                      <button
                          onClick={() => onEdit(vehicle.id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base flex items-center"
                      >
                          <PencilSquareIcon className="h-5 w-5 mr-2" />
                          Edit Vehicle
                      </button>
                    </>
                )}
            </div>
        </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <PhotoGallery photos={vehicle.photos} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold text-neutral-200 mb-4 border-b border-gray-700 pb-2">Vehicle Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SpecItem icon={<CalendarIcon />} label="Year" value={vehicle.year} />
                    <SpecItem icon={<GaugeIcon />} label="Mileage" value={`${parseInt(vehicle.mileage).toLocaleString()} ${vehicle.mileageUnit}`} />
                    <SpecItem icon={<CarIcon />} label="Make" value={vehicle.make.toUpperCase()} />
                    <SpecItem icon={<CarIcon />} label="Model" value={vehicle.model.toUpperCase()} />
                    {vehicle.bodyStyle && <SpecItem icon={<CarIcon />} label="Body Style" value={vehicle.bodyStyle.toUpperCase()} />}
                    {vehicle.size && <SpecItem icon={<CarIcon />} label="Size" value={vehicle.size.toUpperCase()} />}
                    {vehicle.trimLevel && <SpecItem icon={<CarIcon />} label="Trim Level" value={vehicle.trimLevel.toUpperCase()} />}
                    <SpecItem icon={<PaletteIcon />} label="Color" value={vehicle.color.toUpperCase()} />
                    <SpecItem icon={<MapPinIcon />} label="Province/State" value={vehicle.province.toUpperCase()} />
                    {'createdAt' in vehicle && (
                        <SpecItem icon={<ClockIcon />} label="Profile Created" value={new Date((vehicle as Vehicle).createdAt).toLocaleString()} />
                    )}
                </div>
            </div>

            {(vehicle.transmission || vehicle.drivetrain || engineDisplay || vehicle.fuelType || (vehicle.features && vehicle.features.length > 0)) && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-semibold text-neutral-200 mb-3 flex items-center">
                        <ListBulletIcon /> <span className="ml-2">Key Equipment & Features</span>
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {vehicle.transmission && <SpecItem icon={<CarIcon />} label="Transmission" value={vehicle.transmission} />}
                            {vehicle.drivetrain && <SpecItem icon={<CarIcon />} label="Drivetrain" value={vehicle.drivetrain} />}
                        </div>
                        {engineDisplay && <SpecItem icon={<CarIcon />} label="Engine" value={engineDisplay} />}
                        {vehicle.fuelType && <SpecItem icon={<FuelIcon />} label="Fuel Type" value={vehicle.fuelType} />}
                        {vehicle.features && vehicle.features.length > 0 && (
                            <div>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-neutral-200 mt-2">
                                    {vehicle.features.map(feature => (
                                        <li key={feature} className="flex items-center">
                                            <CheckCircleIcon />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isDescriptionVisible ? (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xl font-semibold text-neutral-200">AI-Generated Description</h3>
                        {!isEditingDescription && (
                            <button onClick={() => setIsEditingDescription(true)} className="text-neutral-400 hover:text-white transition-colors p-1">
                                <PencilIcon />
                            </button>
                        )}
                    </div>
                    {isEditingDescription ? (
                        <div className="animate-fade-in">
                            <textarea
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                rows={8}
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                                <button onClick={handleCancelEdit} className="py-2 px-4 border border-gray-700 rounded-lg text-sm font-medium text-neutral-300 bg-gray-800 hover:bg-gray-700 transition duration-200">
                                    Cancel
                                </button>
                                <button onClick={handleSaveDescription} className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition duration-200">
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-neutral-300 leading-relaxed">{vehicle.description.toUpperCase()}</p>
                    )}
                </div>
            ) : (
                 <button 
                    onClick={() => setIsDescriptionVisible(true)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                    Show AI-Generated Description
                </button>
            )}
            
            {vehicle.serviceHistory && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-semibold text-neutral-200 mb-3 flex items-center">
                        <WrenchIcon /> <span className="ml-2">Service History & Notes</span>
                    </h3>
                    <p className="text-neutral-300 whitespace-pre-wrap">{vehicle.serviceHistory.toUpperCase()}</p>
                </div>
            )}

            {vehicle.serviceHistoryPhotos && vehicle.serviceHistoryPhotos.length > 0 && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-semibold text-neutral-200 mb-3">Service Records & Documents</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {vehicle.serviceHistoryPhotos.map((dataUrl, index) => {
                             const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
                             if (mimeType.startsWith('image/')) {
                                return (
                                    <a href={dataUrl} target="_blank" rel="noopener noreferrer" key={index} className="group relative aspect-square">
                                        <img 
                                            src={dataUrl} 
                                            alt={`Service document ${index + 1}`} 
                                            className="rounded-lg object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 border border-gray-800"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
                                            </svg>
                                        </div>
                                    </a>
                                );
                             } else {
                                 return (
                                    <a href={dataUrl} target="_blank" rel="noopener noreferrer" key={index} className="group relative aspect-square bg-gray-800 rounded-lg border border-gray-700 flex flex-col items-center justify-center p-2 text-center transition-all hover:bg-gray-700">
                                        <DocumentTextIcon className="h-12 w-12 text-neutral-400" />
                                        <p className="text-xs text-neutral-300 mt-2">Document {index + 1}</p>
                                    </a>
                                 );
                             }
                        })}
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-800 flex justify-center">
        <a
            href={recallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center text-base w-full sm:w-auto"
        >
            <AlertTriangleIcon />
            Check for Safety Recalls
        </a>
      </div>
    </div>
  );
};

interface SpecItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const SpecItem: React.FC<SpecItemProps> = ({ icon, label, value }) => (
    <div className="flex items-center space-x-3">
        <div className="text-orange-400">{icon}</div>
        <div>
            <p className="text-sm text-neutral-400">{label}</p>
            <p className="font-semibold text-neutral-200">{value.toUpperCase()}</p>
        </div>
    </div>
);

export default VehicleProfile;