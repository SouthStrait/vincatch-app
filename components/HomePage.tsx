import { db } from '../services/firebase';
import React from 'react';
import PlusCircleIcon from './icons/PlusCircleIcon';
import GarageIcon from './icons/GarageIcon';

interface HomePageProps {
  onNavigate: (page: 'form' | 'garage') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <HomeCard
                icon={<PlusCircleIcon />}
                title="Add a New Vehicle"
                description="Start here to create a professional profile for your car, truck, or SUV."
                onClick={() => onNavigate('form')}
            />
            <HomeCard
                icon={<GarageIcon />}
                title="My Garage"
                description="View, manage, and share the profiles of your saved vehicles."
                onClick={() => onNavigate('garage')}
            />
        </div>
    </div>
  );
};

interface HomeCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

const HomeCard: React.FC<HomeCardProps> = ({ icon, title, description, onClick }) => (
    <div
        onClick={onClick}
        className="bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800 cursor-pointer transition-all duration-300 hover:border-orange-500 hover:scale-105 hover:bg-gray-800/50"
    >
        <div className="flex flex-col items-center text-center">
            {icon}
            <h2 className="mt-4 text-2xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-neutral-400">{description}</p>
        </div>
    </div>
);


export default HomePage;