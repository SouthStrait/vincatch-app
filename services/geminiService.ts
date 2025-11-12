// File: src/services/geminiService.ts

import { Vehicle } from '../types';

// The GoogleGenAI import is not needed here since the client only talks to your server API
// You can delete this line: import { GoogleGenAI } from "@google/genai";

export const generateDescriptionClient = async (
    vehicle: Omit<Vehicle, 'description' | 'id' | 'createdAt'>
): Promise<string> => {
    try {
        // This makes an HTTP POST request to your new Vercel API Route
        const response = await fetch('/api/generate-description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vehicle),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to generate description from API.');
        }

        const data = await response.json();
        return data.description;

    } catch (error) {
        console.error("Error calling server-side description API:", error);
        throw new Error("Failed to generate description. Please try again.");
    }
};
