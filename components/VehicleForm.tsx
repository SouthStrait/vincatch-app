import { db } from '../services/firebase';
import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import PhotoUploadSlot from './PhotoUploadSlot';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CameraModal from './CameraModal';

interface VehicleFormProps {
  onSubmit: (vehicleData: Omit<Vehicle, 'description' | 'id' | 'createdAt'>) => void;
  initialData?: Vehicle | null;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const photoLabels = [
  'Front', 'Driver Side', 'Rear', 'Passenger Side', 'Roof', 'Wheel',
  'Interior Front Driver', 'Interior Front Passenger', 'Rear Seats', 'Odometer',
  'Dashboard/Infotainment', 'Other/Damages'
];

const canadianProvinces = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon"
].sort();

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
].sort();

const commonColors = [
    "Beige", "Black", "Blue", "Brown", "Gold", "Gray", "Green", "Orange",
    "Purple", "Red", "Silver", "White", "Yellow"
];

const pickupCabSizes = [
    "Regular Cab",
    "Ext/Super Cab",
    "Crew Cab",
].sort();

const toyotaSedanCoupeTrims = [
    "L", "LE", "SE", "XSE", "TRD", "GR", "XLE", "Limited", "Platinum/Capstone"
];

const transmissionOptions = ["Automatic", "Manual", "Direct Drive"];
const drivetrainOptions = ["FWD", "RWD", "4x4", "AWD", "4x2"];

const fuelTypeOptions = [
    "Gasoline", "Hybrid", "Diesel", "Electric", "Propane", "Hydrogen"
];

const featureGroups = {
  "Technology & Entertainment": [
    "Android Auto",
    "Apple CarPlay",
    "Bluetooth",
    "Navigation System",
  ],
  "Safety & Driver-Assist": [
    "Backup Camera",
    "Blind Spot Monitor",
    "Fog Lights",
    "Lane Departure",
    "Parking Sensors",
  ],
  "Comfort & Convenience": [
    "Cooled Seats",
    "Heated Rear Seats",
    "Heated Seats",
    "Keyless Start",
    "Leather Seats",
    "Power Driver Seat",
    "Push to Start",
    "Remote Start",
    "Sunroof / Moonroof",
    "Third-row Seating",
  ],
  "Exterior & Utility": [
    "Power Running Boards",
    "Premium Wheels",
    "Tow Package",
  ],
};


// Helper components moved outside the main component to prevent re-mounting on re-render.

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, ...props }) => {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-neutral-300 mb-2">{label}</label>
            <input id={name} name={name} {...props} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200" />
        </div>
    );
}

type FormDataState = {
  vin: string; year: string; make: string; model: string; trimLevel: string;
  bodyStyle: string; size: string; province: string; mileage: string;
  mileageUnit: string; color: string; serviceHistory: string;
  transmission: string; drivetrain: string; engineCylinders: string; displacement: string; fuelType: string; features: string[];
};

interface DetailsSectionProps {
  formData: Omit<FormDataState, 'transmission' | 'drivetrain' | 'engineCylinders' | 'displacement' | 'fuelType' | 'features'>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleColorChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleDecodeVin: () => Promise<void>;
  isDecoding: boolean;
  vinError: string | null;
  showOtherColor: boolean;
  availableTrims: string[];
  isFetchingTrims: boolean;
  fallbackOptions: string[];
}

const DetailsSection: React.FC<DetailsSectionProps> = ({ 
  formData, handleChange, handleColorChange, handleDecodeVin, isDecoding, 
  vinError, showOtherColor, availableTrims, isFetchingTrims, fallbackOptions 
}) => {
  const isPickup = formData.bodyStyle.toUpperCase().includes('PICKUP');

  return (
     <section>
       <h2 className="text-2xl font-bold mb-6 text-neutral-200 border-b border-gray-700 pb-3">Vehicle Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="vin" className="block text-sm font-medium text-neutral-300 mb-2">VIN</label>
          <div className="relative">
              <input id="vin" name="vin" value={formData.vin} onChange={handleChange} required className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 pr-28 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200" />
              <button type="button" onClick={handleDecodeVin} disabled={isDecoding} className="absolute inset-y-0 right-0 flex items-center px-4 m-1 bg-gray-600 text-neutral-200 text-sm font-semibold rounded-md hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors">
                {isDecoding ? 'Decoding...' : 'Decode VIN'}
              </button>
          </div>
          {vinError && <p className="text-rose-400 text-sm mt-2">{vinError}</p>}
        </div>

        <InputField label="Year" name="year" value={formData.year} onChange={handleChange} required type="number" min="1900" max={new Date().getFullYear() + 1} />
        <InputField label="Make" name="make" value={formData.make} onChange={handleChange} required />
        <InputField label="Model" name="model" value={formData.model} onChange={handleChange} required />

         <div>
          <label htmlFor="bodyStyle" className="block text-sm font-medium text-neutral-300 mb-2">Body Style</label>
          <select id="bodyStyle" name="bodyStyle" value={formData.bodyStyle} onChange={handleChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200">
            <option value="">Select Body Style</option>
            <option>Sedan</option>
            <option>Coupe</option>
            <option>Hatchback</option>
            <option>Convertible</option>
            <option>SUV</option>
            <option>Pickup</option>
            <option>Van/Minivan</option>
            <option>Wagon</option>
          </select>
        </div>
        
        {isPickup && (
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-neutral-300 mb-2">Cab Size</label>
              <select id="size" name="size" value={formData.size} onChange={handleChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200">
                <option value="">Select Cab Size</option>
                {pickupCabSizes.map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
        )}
         <div>
          <label htmlFor="trimLevel" className="block text-sm font-medium text-neutral-300 mb-2">Trim Level</label>
           <div className="relative">
            <input 
                id="trimLevel" 
                name="trimLevel" 
                value={formData.trimLevel} 
                onChange={handleChange} 
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200" 
                list="trim-suggestions"
            />
             {isFetchingTrims && (
               <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="animate-spin h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              </div>
            )}
           </div>
           <datalist id="trim-suggestions">
            {(availableTrims.length > 0 ? availableTrims : fallbackOptions).map(trim => (
                <option key={trim} value={trim} />
            ))}
           </datalist>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <InputField label="Mileage" name="mileage" value={formData.mileage} onChange={handleChange} required type="number" min="0" />
            <div>
              <label htmlFor="mileageUnit" className="block text-sm font-medium text-neutral-300 mb-2">Unit</label>
              <select id="mileageUnit" name="mileageUnit" value={formData.mileageUnit} onChange={handleChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200">
                <option value="km">km</option>
                <option value="miles">miles</option>
              </select>
            </div>
        </div>

        <div>
            <label htmlFor="province" className="block text-sm font-medium text-neutral-300 mb-2">Province/State</label>
            <select id="province" name="province" value={formData.province} onChange={handleChange} required className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200">
                <option value="">Select Province/State</option>
                <optgroup label="Canada">
                    {canadianProvinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </optgroup>
                <optgroup label="United States">
                    {usStates.map(state => <option key={state} value={state}>{state}</option>)}
                </optgroup>
            </select>
        </div>
        
         <div>
            <label htmlFor="color" className="block text-sm font-medium text-neutral-300 mb-2">Exterior Color</label>
            <select id="color" name="color" value={formData.color} onChange={handleColorChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200">
                <option value="">Select Color</option>
                {commonColors.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Other">Other...</option>
            </select>
            {showOtherColor && (
                <input
                    type="text"
                    name="color"
                    value={formData.color === 'Other' ? '' : formData.color}
                    onChange={handleChange}
                    placeholder="Enter custom color"
                    className="mt-2 w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
                />
            )}
        </div>
      </div>
    </section>
  );
}

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = ["Vehicle Details", "Equipment", "Photos", "Service History"];
  return (
    <nav aria-label="Progress" className="mb-12">
      <ol role="list" className="flex space-x-2 sm:space-x-4">
        {steps.map((stepName, index) => {
          const stepNumber = index + 1;
          const status = currentStep > stepNumber ? 'complete' : currentStep === stepNumber ? 'current' : 'upcoming';
          
          return (
            <li key={stepName} className="flex-1">
              {status === 'complete' ? (
                <div className="group flex flex-col border-t-4 border-green-500 pt-2 text-center">
                  <span className="text-xs sm:text-sm font-semibold text-green-400">{`Step ${stepNumber}`}</span>
                  <span className="text-xs sm:text-sm font-medium text-neutral-200">{stepName}</span>
                </div>
              ) : status === 'current' ? (
                <div className="flex flex-col border-t-4 border-orange-500 pt-2 text-center" aria-current="step">
                  <span className="text-xs sm:text-sm font-semibold text-orange-400">{`Step ${stepNumber}`}</span>
                  <span className="text-xs sm:text-sm font-medium text-neutral-100">{stepName}</span>
                </div>
              ) : (
                <div className="group flex flex-col border-t-4 border-gray-800 pt-2 text-center">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500">{`Step ${stepNumber}`}</span>
                  <span className="text-xs sm:text-sm font-medium text-neutral-400">{stepName}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit, initialData }) => {
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    vin: '', year: '', make: '', model: '', trimLevel: '', bodyStyle: '', size: '', province: '',
    mileage: '', mileageUnit: 'km', color: '', serviceHistory: '',
    transmission: '', drivetrain: '', engineCylinders: '', displacement: '', fuelType: '', features: [] as string[]
  });
  const [photos, setPhotos] = useState<(string | null)[]>(Array(photoLabels.length).fill(null));
  const [serviceHistoryPhotos, setServiceHistoryPhotos] = useState<string[]>([]);

  const [isDecoding, setIsDecoding] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);
  
  const [showOtherColor, setShowOtherColor] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoSlotIndex, setPhotoSlotIndex] = useState<number | null>(null);

  const [availableTrims, setAvailableTrims] = useState<string[]>([]);
  const [isFetchingTrims, setIsFetchingTrims] = useState(false);
  
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData, // Keep default for fields that might be null/undefined
        ...initialData,
        features: initialData.features || [],
      });
      setPhotos(initialData.photos || Array(photoLabels.length).fill(null));
      setServiceHistoryPhotos(initialData.serviceHistoryPhotos || []);
    }
  }, [initialData]);

  useEffect(() => {
    const fetchTrims = async () => {
        if (!formData.year || !formData.make || !formData.model) {
            setAvailableTrims([]);
            return;
        }
        setIsFetchingTrims(true);
        try {
            const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetTrimsForMakeModelYear/make/${encodeURIComponent(formData.make)}/model/${encodeURIComponent(formData.model)}/modelyear/${formData.year}?format=json`);
            
            if (!response.ok) {
                // A 404 status from this API likely means no results were found for the combination.
                // We can treat it as a successful call that returned no trims, rather than an application error.
                if (response.status === 404) {
                    setAvailableTrims([]);
                    return; 
                }
                // For other errors (e.g., 500 server errors), we should throw.
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();

            // Ensure the response has the expected structure before processing.
            if (data && data.Results && Array.isArray(data.Results)) {
                const trims = data.Results
                    .map((item: { Trim: string }) => item.Trim)
                    .filter((t: string | null): t is string => !!t && t.trim() !== ''); // Ensure trims are valid strings
                setAvailableTrims(Array.from(new Set(trims)));
            } else {
                setAvailableTrims([]);
            }
        } catch (error) {
            console.error("Error fetching trims:", error);
            setAvailableTrims([]); // Clear on error
        } finally {
            setIsFetchingTrims(false);
        }
    };

    const debounce = setTimeout(fetchTrims, 500); // Debounce API call
    return () => clearTimeout(debounce);
}, [formData.year, formData.make, formData.model]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'vin') {
      finalValue = value.replace(/\s/g, '').toUpperCase();
    } else if (['make', 'model', 'trimLevel'].includes(name)) {
      // Trim whitespace from fields that affect API calls and data consistency.
      finalValue = value.trim();
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Other') {
        setShowOtherColor(true);
        setFormData(prev => ({...prev, color: ''}));
    } else {
        setShowOtherColor(false);
        setFormData(prev => ({...prev, color: value}));
    }
  };
  
  const handleFeatureChange = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      const newPhotos = [...photos];
      newPhotos[index] = base64;
      setPhotos(newPhotos);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
  };
  
  const handleServiceHistoryPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        const base64Promises = files.map(fileToBase64);
        const newPhotos = await Promise.all(base64Promises);
        setServiceHistoryPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleRemoveServiceHistoryPhoto = (index: number) => {
    setServiceHistoryPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleTakePhotoRequest = (index: number) => {
    setPhotoSlotIndex(index);
    setIsCameraOpen(true);
  };

  const handleCapturePhoto = (imageDataUrl: string) => {
    if (photoSlotIndex !== null) {
      const newPhotos = [...photos];
      newPhotos[photoSlotIndex] = imageDataUrl;
      setPhotos(newPhotos);
    }
    setIsCameraOpen(false);
    setPhotoSlotIndex(null);
  };

  const handleDecodeVin = async () => {
    if (!formData.vin || formData.vin.length < 11) {
      setVinError("Please enter a valid VIN (at least 11 characters).");
      return;
    }
    setIsDecoding(true);
    setVinError(null);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${formData.vin}?format=json`);
      if (!response.ok) {
        throw new Error('VIN decoding failed.');
      }
      const data = await response.json();
      const results = data.Results;
      const getValue = (variable: string) => (results.find((r: any) => r.Variable === variable)?.Value || '').trim();

      const engineCylinders = getValue('Engine Cylinders');
      const engineDisplacementL = getValue('Engine Displacement (L)');

      setFormData(prev => ({
        ...prev,
        year: getValue('Model Year') || prev.year,
        make: getValue('Make') || prev.make,
        model: getValue('Model') || prev.model,
        trimLevel: getValue('Trim') || prev.trimLevel,
        bodyStyle: getValue('Body Class') || prev.bodyStyle,
        engineCylinders: engineCylinders || prev.engineCylinders,
        displacement: engineDisplacementL || prev.displacement,
        fuelType: getValue('Fuel Type - Primary') || prev.fuelType,
      }));
    } catch (error) {
      console.error("VIN decoding error:", error);
      setVinError("Could not decode VIN. Please check and try again, or fill details manually.");
    } finally {
      setIsDecoding(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleData = {
      ...formData,
      photos,
      serviceHistoryPhotos,
    };
    onSubmit(vehicleData);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  
  const fallbackOptions =
    formData.make.toUpperCase() === 'TOYOTA' ? toyotaSedanCoupeTrims : [];
    
  return (
    <div className="bg-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-800 animate-fade-in">
        <Stepper currentStep={step} />
        
        <form onSubmit={handleFormSubmit}>
            <div className={step === 1 ? 'animate-fade-in' : 'hidden'}>
              <DetailsSection 
                formData={formData} 
                handleChange={handleChange} 
                handleColorChange={handleColorChange}
                handleDecodeVin={handleDecodeVin}
                isDecoding={isDecoding}
                vinError={vinError}
                showOtherColor={showOtherColor}
                availableTrims={availableTrims}
                isFetchingTrims={isFetchingTrims}
                fallbackOptions={fallbackOptions}
              />
            </div>
            
            <div className={step === 2 ? 'animate-fade-in' : 'hidden'}>
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-neutral-200 border-b border-gray-700 pb-3">Equipment & Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="transmission" className="block text-sm font-medium text-neutral-300 mb-2">Transmission</label>
                            <select id="transmission" name="transmission" value={formData.transmission} onChange={handleChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200">
                                <option value="">Select Transmission</option>
                                {transmissionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="drivetrain" className="block text-sm font-medium text-neutral-300 mb-2">Drivetrain</label>
                            <select id="drivetrain" name="drivetrain" value={formData.drivetrain} onChange={handleChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200">
                                <option value="">Select Drivetrain</option>
                                {drivetrainOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="fuelType" className="block text-sm font-medium text-neutral-300 mb-2">Fuel Type</label>
                            <select id="fuelType" name="fuelType" value={formData.fuelType} onChange={handleChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200">
                                <option value="">Select Fuel Type</option>
                                {fuelTypeOptions.map(fuel => <option key={fuel} value={fuel}>{fuel}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="engineCylinders" className="block text-sm font-medium text-neutral-300 mb-2">Engine Cylinders</label>
                            <select id="engineCylinders" name="engineCylinders" value={formData.engineCylinders} onChange={handleChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200">
                                <option value="">Select Cylinders</option>
                                {[...Array(11).keys()].map(i => <option key={i} value={i}>{i === 0 ? 'N/A' : i}</option>)}
                            </select>
                        </div>
                        <InputField label="Displacement (L)" name="displacement" value={formData.displacement} onChange={handleChange} placeholder="e.g., 2.0, 3.5, 5.0" type="number" step="0.1" min="0" />
                    </div>
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-neutral-300 mb-4">Key Features</h3>
                        {Object.entries(featureGroups).map(([groupName, features]) => (
                            <div key={groupName} className="mb-4">
                                <p className="font-medium text-neutral-400 mb-2">{groupName}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {features.map(feature => (
                                        <div key={feature} className="flex items-center">
                                            <input
                                                id={`feature-${feature}`}
                                                type="checkbox"
                                                checked={formData.features.includes(feature)}
                                                onChange={() => handleFeatureChange(feature)}
                                                className="h-4 w-4 rounded border-gray-500 bg-gray-900 text-orange-500 focus:ring-orange-600"
                                            />
                                            <label htmlFor={`feature-${feature}`} className="ml-2 text-sm text-neutral-300">{feature}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            
            <div className={step === 3 ? 'animate-fade-in' : 'hidden'}>
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-neutral-200 border-b border-gray-700 pb-3">Vehicle Photos</h2>
                    <p className="text-sm text-neutral-400 mb-6">Upload clear photos of your vehicle. Good photos increase interest and value.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photoLabels.map((label, index) => (
                            <PhotoUploadSlot
                                key={index}
                                label={label}
                                index={index}
                                previewUrl={photos[index]}
                                onPhotoChange={handlePhotoChange}
                                onRemove={handleRemovePhoto}
                                onTakePhotoRequest={handleTakePhotoRequest}
                            />
                        ))}
                    </div>
                </section>
            </div>

            <div className={step === 4 ? 'animate-fade-in' : 'hidden'}>
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-neutral-200 border-b border-gray-700 pb-3">Service History & Notes</h2>
                    <div>
                        <label htmlFor="serviceHistory" className="block text-sm font-medium text-neutral-300 mb-2">
                            Describe any recent service, known issues, or key selling points.
                        </label>
                        <textarea
                            id="serviceHistory"
                            name="serviceHistory"
                            value={formData.serviceHistory}
                            onChange={handleChange}
                            rows={8}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
                            placeholder="e.g., New tires installed at 120,000 km. Regular oil changes every 5,000 km. Small scratch on rear bumper."
                        />
                    </div>
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Upload Service Records (Optional)</label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-700 px-6 py-10 hover:border-orange-500 transition-colors">
                            <div className="text-center">
                                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-500" />
                                <div className="mt-4 flex text-sm leading-6 text-neutral-400">
                                    <label
                                        htmlFor="service-file-upload"
                                        className="relative cursor-pointer rounded-md bg-gray-900 font-semibold text-orange-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-orange-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-950 hover:text-orange-500"
                                    >
                                        <span>Upload files</span>
                                        <input id="service-file-upload" name="service-file-upload" type="file" className="sr-only" multiple onChange={handleServiceHistoryPhotoChange} accept="image/*,.pdf,.doc,.docx" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-500">Images, PDF, DOCX up to 10MB each</p>
                            </div>
                        </div>
                    </div>
                    {serviceHistoryPhotos.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-neutral-300">Uploaded files:</p>
                            <ul className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {serviceHistoryPhotos.map((photo, index) => (
                                    <li key={index} className="relative group aspect-square bg-gray-950 border border-gray-800 rounded-lg p-2 flex items-center justify-center">
                                        <DocumentTextIcon className="h-10 w-10 text-neutral-400" />
                                        <p className="text-xs text-neutral-400 absolute bottom-1">Document {index + 1}</p>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveServiceHistoryPhoto(index)}
                                            className="absolute top-1 right-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded-full p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Remove document"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            </div>

            <div className="mt-10 flex justify-between items-center">
                {step > 1 ? (
                    <button type="button" onClick={prevStep} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200">
                        Back
                    </button>
                ) : (
                    <div></div> // Placeholder to keep "Next" on the right
                )}
                
                {step < 4 ? (
                    <button type="button" onClick={nextStep} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200">
                        Next
                    </button>
                ) : (
                    <div className="text-right">
                        <button 
                            type="submit" 
                            disabled={!isEditing && !formData.serviceHistory.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500"
                        >
                            {isEditing ? 'Update Profile' : 'Generate Profile'}
                        </button>
                        {!isEditing && !formData.serviceHistory.trim() && (
                            <p className="text-xs text-rose-400 mt-2">
                                Please provide service history notes to continue.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </form>

        {isCameraOpen && (
            <CameraModal 
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapturePhoto}
            />
        )}
    </div>
  );
};

export default VehicleForm;