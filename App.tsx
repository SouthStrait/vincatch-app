import React, { useState, useEffect } from 'react';
import { Vehicle, User } from './types';
import VehicleForm from './components/VehicleForm';
import VehicleProfile from './components/VehicleProfile';
import { generateDescriptionClient } from './services/geminiService';
import HomePage from './components/HomePage';
import Garage from './components/Garage';
import Clock from './components/Clock';
import HomeIcon from './components/icons/HomeIcon';
import AuthPage from './components/AuthPage';
import LogoutIcon from './components/icons/LogoutIcon';


type View = 'home' | 'form' | 'garage' | 'profile';
type PendingVehicle = Omit<Vehicle, 'createdAt'>;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const userJson = localStorage.getItem('vincatch_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  });

  const [view, setView] = useState<View>('home');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [pendingVehicle, setPendingVehicle] = useState<PendingVehicle | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getStorageKey = () => `vincatch_vehicles_${currentUser?.email}`;


  // Effect to load/save vehicles from localStorage whenever the user or vehicles change
  useEffect(() => {
    if (currentUser) {
      // Load vehicles for the current user
      try {
        const savedVehicles = localStorage.getItem(getStorageKey());
        setVehicles(savedVehicles ? JSON.parse(savedVehicles) : []);
      } catch (error) {
        console.error("Could not load vehicles from localStorage", error);
        setVehicles([]);
      }
    } else {
      // Clear vehicles when logged out
      setVehicles([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      // Save vehicles when they change for the logged-in user
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(vehicles));
      } catch (error) {
        console.error("Could not save vehicles to localStorage", error);
      }
    }
  }, [vehicles, currentUser]);


  useEffect(() => {
    if (currentUser) {
        localStorage.setItem('vincatch_user', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('vincatch_user');
    }
  }, [currentUser]);

  const handleSignUp = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('vincatch_users') || '{}');
    if (users[email]) {
        throw new Error('Email address is already in use.');
    }
    // Very simple "hashing" for demonstration. DO NOT use in production.
    const passwordHash = btoa(password + email.split('@')[0]);
    users[email] = { passwordHash };
    localStorage.setItem('vincatch_users', JSON.stringify(users));
    setCurrentUser({ email });
    setView('home');
  };

  const handleLogin = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('vincatch_users') || '{}');
    const user = users[email];
    const passwordHash = btoa(password + email.split('@')[0]);

    if (!user || user.passwordHash !== passwordHash) {
        throw new Error('Invalid email or password.');
    }
    setCurrentUser({ email });
    setView('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home'); // Reset view on logout
  };


  const handleFormSubmit = async (formData: Omit<Vehicle, 'description' | 'id' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const description = await generateDescriptionClient(formData);
      
      if (vehicleToEdit) {
        // Update logic
        const updatedVehicle: Vehicle = {
          ...vehicleToEdit,
          ...formData,
          description,
        };
        setVehicles(prev => prev.map(v => v.id === vehicleToEdit.id ? updatedVehicle : v));
        setSelectedVehicleId(vehicleToEdit.id);
        setVehicleToEdit(null);
        setView('profile');
      } else {
        // Create logic
        const newVehicle: PendingVehicle = { 
          ...formData, 
          id: `${Date.now()}-${formData.vin}`,
          description 
        };
        setPendingVehicle(newVehicle);
        setSelectedVehicleId(null);
        setView('profile');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to generate or update vehicle profile. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveVehicle = () => {
    if (pendingVehicle) {
      const vehicleWithTimestamp: Vehicle = {
        ...pendingVehicle,
        createdAt: new Date().toISOString()
      };
      setVehicles(prev => [...prev, vehicleWithTimestamp]);
      setPendingVehicle(null);
      setView('garage');
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
    const vehicle = vehicles.find(v => v.id === vehicleId);
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
    setVehicleToEdit(null); // Clear editing state on navigation
    setView(targetView);
  };

  const renderAppContent = () => {
    if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-900/50 rounded-lg">
            <svg className="animate-spin h-10 w-10 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold text-neutral-300">{vehicleToEdit ? 'Updating your vehicle profile...' : 'Generating stunning vehicle profile...'}</p>
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
        const vehicleToShow = pendingVehicle || vehicles.find(v => v.id === selectedVehicleId);
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
        {currentUser ? renderAppContent() : <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} />}
      </main>

      <footer className="text-center mt-12 text-gray-500 text-sm">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;