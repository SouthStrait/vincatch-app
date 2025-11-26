import React, { useState, useEffect } from 'react';
import { Vehicle, User, PhotoMetadata } from './types'; 
import VehicleForm from './components/VehicleForm';
import VehicleProfile from './components/VehicleProfile';
import { generateDescriptionClient } from './services/geminiService';
import HomePage from './components/HomePage';
import Garage from './components/Garage';
import Clock from './components/Clock';
import HomeIcon from './components/icons/HomeIcon';
import AuthPage from './components/AuthPage';
import LogoutIcon from './components/icons/LogoutIcon';


// --- FIREBASE IMPORTS ---
// IMPORTANT: Ensure your firebase.ts exports 'storage'
import { auth, db, storage } from './services/firebase'; 
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut, 
    onAuthStateChanged, 
    User as FirebaseUser 
} from 'firebase/auth';

import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    setDoc, 
    serverTimestamp 
} from 'firebase/firestore';

type View = 'home' | 'form' | 'garage' | 'profile';
type PendingVehicle = Omit<Vehicle, 'createdAt'>;
type AuthenticatedUser = User & { uid: string }; 

const App: React.FC = () => {

    // 1. STATE: User tracking and Auth Loading
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // 2. REST OF EXISTING STATE
    const [view, setView] = useState<View>('home');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [pendingVehicle, setPendingVehicle] = useState<PendingVehicle | null>(null);
    const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // -------------------------------------------------------------------------
    // 3. CONSOLIDATED AUTH AND DATA LISTENER
    // -------------------------------------------------------------------------
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const authenticatedUser: AuthenticatedUser = { 
                    email: firebaseUser.email || 'N/A', 
                    uid: firebaseUser.uid 
                };
                setCurrentUser(authenticatedUser);
                
                // Load data immediately upon successful authentication
                const loadVehicles = async (uid: string) => {
                    const q = query(collection(db, 'vehicles'), where('ownerId', '==', uid));
                    try {
                        const snapshot = await getDocs(q);
                        const loadedVehicles = snapshot.docs.map(doc => ({
                            id: doc.id,
                            createdAt: (doc.data().createdAt?.toDate() || new Date()).toISOString(), 
                            ...doc.data() as Omit<Vehicle, 'id' | 'createdAt'>
                        }));
                        setVehicles(loadedVehicles as Vehicle[]);
                    } catch (error) {
                        console.error("Could not load vehicles from Firestore", error);
                        setError("Failed to load vehicle data.");
                        setVehicles([]);
                    }
                };
                
                loadVehicles(firebaseUser.uid);

            } else {
                setCurrentUser(null);
                setVehicles([]);
            }
            setAuthLoading(false); // Authentication state is now known
        });

        // Cleanup: Stop listening when the component unmounts
        return () => {
            unsubscribeAuth();
        };
    }, []); 
    
    
    // -------------------------------------------------------------------------
    // 4. FIREBASE AUTH HANDLERS
    // -------------------------------------------------------------------------

    const handleSignUp = async (email: string, password: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userDocRef, { 
                email: email,
                createdAt: serverTimestamp(),
            });
            setView('home'); 

        } catch (error: any) {
            throw new Error(error.message || 'Sign up failed.');
        }
    };

    const handleLogin = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setView('home'); 
        } catch (error: any) {
            throw new Error(error.message || 'Invalid email or password.');
        }
    };

    const handleLogout = () => {
        signOut(auth); 
        setView('home'); 
    };

    // -------------------------------------------------------------------------
    // 5. FIREBASE STORAGE HELPER FUNCTION (UPDATED FOR ERROR HANDLING)
    // -------------------------------------------------------------------------

    const uploadBase64ToStorage = async (base64String: string, ownerId: string, index: number): Promise<PhotoMetadata | null> => {
        
        // 1. Guard against uninitialized storage
        if (!storage) {
            console.error("Firebase Storage service is not initialized.");
            return null;
        }

        // 2. Guard against invalid input data (Base64 string or ID)
        // We use a length check to filter out empty/malformed strings gracefully
        if (!base64String || !ownerId || typeof base64String !== 'string' || base64String.length < 100) {
            console.warn(`Skipping invalid/missing Base64 string or Owner ID at index ${index}.`);
            return null;
        }

        try {
            // 3. Create the Storage Reference
            const fileName = `photo_${Date.now()}_${index}.jpg`;
            const storagePath = `vehicles/${ownerId}/photos/${fileName}`;
            const storageRef = ref(storage, storagePath);

            // 4. Upload the Base64 String using 'data_url' format
            await uploadString(storageRef, base64String, 'data_url');
            
            // 5. Get the Download URL
            const downloadURL = await getDownloadURL(storageRef);

            // 6. Return the PhotoMetadata object
            return { 
                downloadURL: downloadURL,
                path: storagePath,
                fileName: fileName 
            };
        } catch (e) {
            console.error(`Error uploading photo at index ${index}:`, e);
            return null; // Return null on any upload failure
        }
    };

    // -------------------------------------------------------------------------
    // 6. FIRESTORE DATA HANDLER (UPDATED to include photo upload/filtering)
    // -------------------------------------------------------------------------

const handleFormSubmit = async (formData: Omit<Vehicle, 'description' | 'id' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
        // 💡 CRITICAL FIX: Explicitly pull out the large file fields 
        // (photos and serviceHistoryPhotos) into temporary variables.
        const { photos, serviceHistoryPhotos, ...specifications } = formData as any;

        // 1. Pass ONLY the clean, small specification data to the Gemini API service.
        // This resolves the 413 "Request Entity Too Large" error.
        const description = await generateDescriptionClient(specifications); 
        
        // 2. The rest of your logic runs, preserving the original formData
        // (which contains the raw files) for the next step (handleSaveVehicle)
        
        if (vehicleToEdit) {
            // ... (editing logic) ...
        } else {
            const newVehicle: PendingVehicle = { 
                ...formData, // Use original formData here so raw files are ready for upload
                id: `${Date.now()}-${formData.vin}`,
                description 
            };
            setPendingVehicle(newVehicle);
            setSelectedVehicleId(null);
            setView('profile');
        }
    } catch (e) {
        console.error(e);
        // Display a more specific error to the user based on the failure
        setError('Failed to generate or update vehicle profile. The request payload may be too large.');
    } finally {
        setIsLoading(false);
    }
};
    
    const handleSaveVehicle = async () => { 
        if (pendingVehicle && currentUser?.uid) {
            setIsLoading(true);
            setError(null);

            // 1. Isolate the RAW Base64 data from the pending vehicle object
            const rawPhotos = (pendingVehicle as any).photos || [];
            const rawServicePhotos = (pendingVehicle as any).serviceHistoryPhotos || [];

            // 2. Destructure the object to exclude large raw fields from Firestore data
            const { 
                id, 
                photos: excludedRawPhotos, // Exclude the raw Base64 strings
                serviceHistoryPhotos: excludedRawServicePhotos, 
                ...restOfVehicleData 
            } = pendingVehicle as any;

            try {
                // 3. Upload all raw photos to Firebase Storage in parallel
                const photoUploadPromises = rawPhotos.map((base64String: string, index: number) => 
                    uploadBase64ToStorage(base64String, currentUser!.uid, index)
                );
                const servicePhotoUploadPromises = rawServicePhotos.map((base64String: string, index: number) => 
                    uploadBase64ToStorage(base64String, currentUser!.uid, index + rawPhotos.length)
                );
                
                // Wait for all uploads to complete (some may resolve to null if invalid)
                const photosMetadataRaw = await Promise.all(photoUploadPromises);
                const servicePhotosMetadataRaw = await Promise.all(servicePhotoUploadPromises);

                // 4. Filter out null results (invalid Base64 strings)
                const photosMetadata = photosMetadataRaw.filter(meta => meta !== null) as PhotoMetadata[];
                const servicePhotosMetadata = servicePhotosMetadataRaw.filter(meta => meta !== null) as PhotoMetadata[];

                // 5. Prepare the final data for Firestore (now includes small URL arrays)
                const vehicleData = {
                    ...restOfVehicleData, 
                    photos: photosMetadata, 
                    serviceHistoryPhotos: servicePhotosMetadata, 
                    createdAt: serverTimestamp(), 
                    ownerId: currentUser.uid      
                };

                // 6. Save the document to Firestore
                const docRef = doc(collection(db, 'vehicles'));
                await setDoc(docRef, vehicleData);
                
                // 7. Update local state
                const vehicleWithId: Vehicle = {
                    ...pendingVehicle,
                    id: docRef.id, 
                    photos: photosMetadata, 
                    serviceHistoryPhotos: servicePhotosMetadata,
                    createdAt: new Date().toISOString()
                };
                
                setVehicles(prev => [...prev, vehicleWithId]);
                setPendingVehicle(null);
                setView('garage');
                
            } catch (error) {
                console.error("Failed to save vehicle and upload photos:", error);
                setError("Failed to save vehicle and upload photos. Please ensure Storage Rules are published."); 
            } finally {
                setIsLoading(false);
            }
        }
    };


    const handleDiscardVehicle = () => {
        setPendingVehicle(null);
        setView('home');
    };

    const handleSelectVehicle = (vehicleId: string) => {
        setSelectedVehicleId(vehicleId);
        setPendingVehicle(null);
        setView('profile');
    };
    
    const handleEditVehicle = (vehicleId: string) => {
        // FIX: Ensure vehicles is an array before calling find()
        const vehicle = Array.isArray(vehicles) ? vehicles.find(v => v.id === vehicleId) : undefined;
        
        if (vehicle) {
            setVehicleToEdit(vehicle);
            setView('form');
        }
    };


    const handleUpdateVehicleDescription = (vehicleId: string, newDescription: string) => {
        if (pendingVehicle && pendingVehicle.id === vehicleId) {
            setPendingVehicle({ ...pendingVehicle, description: newDescription });
            return;
        }

        setVehicles(prevVehicles =>
            prevVehicles.map(v =>
                v.id === vehicleId ? { ...v, description: newDescription } : v
            )
        );
    };

    const navigate = (targetView: View) => {
        setError(null);
        setVehicleToEdit(null); 
        setView(targetView);
    };

    const renderAppContent = () => {
        if (isLoading || authLoading) { 
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-900/50 rounded-lg">
                    <svg className="animate-spin h-10 w-10 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg font-semibold text-neutral-300">{isLoading ? (vehicleToEdit ? 'Updating your vehicle profile...' : 'Generating stunning vehicle profile...') : 'Checking user session...'}</p>
                    <p className="text-sm text-neutral-400">This may take a moment.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-rose-900/50 border border-rose-700 text-rose-200 px-4 py-3 rounded-lg relative text-center" role="alert">
                    <strong className="font-bold">An error occurred: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            );
        }

        switch (view) {
            case 'home':
                return <HomePage onNavigate={(page) => navigate(page)} />;
            case 'form':
                return <VehicleForm onSubmit={handleFormSubmit} initialData={vehicleToEdit} />;
            case 'garage':
                return <Garage vehicles={vehicles} onSelectVehicle={handleSelectVehicle} onNavigateHome={() => navigate('home')} />;
            
            case 'profile':
                // FIX: Defensive check before calling .find() when determining which vehicle to show.
                const vehicleToShow = pendingVehicle || (Array.isArray(vehicles) ? vehicles.find(v => v.id === selectedVehicleId) : undefined);
                if (vehicleToShow) {
                    return <VehicleProfile 
                                vehicle={vehicleToShow} 
                                isNewProfile={!!pendingVehicle}
                                onSave={handleSaveVehicle}
                                onDiscard={handleDiscardVehicle}
                                onBackToGarage={() => navigate('garage')}
                                onEdit={handleEditVehicle}
                                onUpdateDescription={(newDescription) => handleUpdateVehicleDescription(vehicleToShow.id, newDescription)}
                            />;
                }
                navigate('garage');
                return null;
            default:
                return <HomePage onNavigate={(page) => navigate(page)} />;
        }
    }


    return (
        <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8 relative">
                {currentUser && view !== 'home' && (
                    <button 
                        onClick={() => navigate('home')}
                        className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                        aria-label="Go to Home page"
                    >
                        <HomeIcon className="h-5 w-5" />
                        <span className="ml-2 hidden sm:inline">Home</span>
                    </button>
                )}
                <h1 className="text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-green-400 cursor-pointer" onClick={() => currentUser && navigate('home')}>
                    <span className="font-sans font-bold">VIN</span><span className="font-cursive">catch</span>
                </h1>
                {currentUser && (
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm text-neutral-300 font-medium">Welcome, {currentUser.email}</p>
                            <Clock />
                        </div>
                        <button 
                            onClick={handleLogout} 
                            className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                            aria-label="Logout"
                        >
                            <LogoutIcon className="h-5 w-5" />
                            <span className="ml-2 hidden sm:inline">Logout</span>
                        </button>
                    </div>
                )}
            </header>
            
            <main className="max-w-7xl mx-auto">
                {/* Final Rendering Logic: Checks authLoading first */}
                {authLoading ? renderAppContent() : (
                    currentUser ? renderAppContent() : <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} />
                )}
            </main>

            <footer className="text-center mt-12 text-gray-500 text-sm">
                <p>Powered by Gemini API</p>
            </footer>
        </div>
    );
};
export default App;