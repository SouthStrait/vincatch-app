import { db, storage } from '../services/firebase'; // 🚨 MUST ensure 'storage' is exported from firebase.ts
import { ref, uploadString, getDownloadURL } from 'firebase/storage'; // 🚨 NEW FIREBASE STORAGE IMPORTS
import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import PhotoUploadSlot from './PhotoUploadSlot';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CameraModal from './CameraModal';

interface VehicleFormProps {
  onSubmit: (vehicleData: Omit<Vehicle, 'description' | 'id' | 'createdAt'>) => void;
  initialData?: Vehicle | null;
}

// --- Firebase Storage Utility Function (NEW) ---
const uploadFileToStorage = async (base64Data: string, type: 'photo' | 'service', vin: string, index: number): Promise<string> => {
    // Determine the file type and extension for storage reference
    const mimeType = base64Data.substring(base64Data.indexOf(':') + 1, base64Data.indexOf(';'));
    let ext = 'jpg'; 
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('document')) ext = 'docx';

    // Create a unique path in Firebase Storage using VIN and a unique index/timestamp
    const storageRef = ref(storage, `vehicles/${vin}/${type}s/${type}-${index}-${Date.now()}.${ext}`);

    // uploadString handles base64 data ('data_url' format)
    await uploadString(storageRef, base64Data, 'data_url');
    
    // Get the persistent download URL
    return getDownloadURL(storageRef);
};


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
  const [isLoading, setIsLoading] = useState(false); // 🚨 NEW: For loading state during file upload
  
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

  // 🚨 CRITICAL FIX: The Asynchronous Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vin) {
        alert("VIN is required to save photos and documents.");
        return;
    }

    // Function to handle the upload logic for an array of files/urls
    const processFiles = async (files: (string | null)[], type: 'photo' | 'service'): Promise<string[]> => {
        const uploadPromises = files.map(async (dataUrl, index) => {
            if (!dataUrl) return null;

            // Check if it's a new base64 file (starts with 'data:')
            if (dataUrl.startsWith('data:')) {
                // Upload the file and get the persistent URL
                const downloadUrl = await uploadFileToStorage(dataUrl, type, formData.vin, index);
                return downloadUrl;
            }
            
            // It's an existing Download URL, keep it
            return dataUrl;
        });

        // Wait for all uploads to complete and filter out nulls/undefined
        const urls = await Promise.all(uploadPromises);
        return urls.filter((url): url is string => !!url);
    };

    try {
        setIsLoading(true); // Start loading

        // Process Vehicle Photos
        const uploadedPhotos = await processFiles(photos, 'photo'); // Use local state
        
        // Process Service History Documents/Photos
        const uploadedServicePhotos = await processFiles(serviceHistoryPhotos, 'service'); // Use local state

        // 2. PREPARE FINAL DATA AND CALL ONSUBMIT
        const finalData = {
            ...formData,
            photos: uploadedPhotos, // Use the small download URLs
            serviceHistoryPhotos: uploadedServicePhotos, // Use the small download URLs
        };

        onSubmit(finalData); // Call the parent save function
        // Note: For the immediate view update, the parent component calling onSubmit 
        // must also update its local state (e.g., the vehicle data) with finalData.

    } catch (error) {
        console.error("Error saving vehicle profile:", error);
        alert("An error occurred during file upload. Check the console for details.");
    } finally {
        setIsLoading(false); // End loading
    }
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