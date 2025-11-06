import { GoogleGenAI } from "@google/genai";
import { Vehicle } from '../types';

// In your client-side component or utility that needs the description
// For example, if the original code was in `services/ai-description.ts`

import { Vehicle } from '../types'; // Assuming Vehicle type is still needed client-side

export const generateDescriptionClient = async (
    vehicle: Omit<Vehicle, 'description' | 'id' | 'createdAt'>
): Promise<string> => {
    try {
        // Note: The API route will be at /api/generate-description
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
    const engineDescription = [
        vehicle.engineCylinders ? `${vehicle.engineCylinders} cylinders` : '',
        vehicle.displacement ? `${vehicle.displacement}L` : ''
    ].filter(Boolean).join(' / ');
    
    const prompt = `
        You are an AI assistant creating a vehicle summary.
        Based on the following vehicle details, images, and any attached service documents, generate a clear, concise, and factual description for a potential buyer.
        Focus on key features, condition, and recent maintenance mentioned in the service history.
        Avoid sales jargon and overly enthusiastic language. The goal is a straightforward summary. Do not use markdown.

        Vehicle Details:
        - Year: ${vehicle.year}
        - Make: ${vehicle.make}
        - Model: ${vehicle.model}
        - Trim Level: ${vehicle.trimLevel || 'N/A'}
        - Body Style: ${vehicle.bodyStyle || 'N/A'}
        - Size: ${vehicle.size || 'N/A'}
        - Mileage: ${vehicle.mileage} ${vehicle.mileageUnit}
        - Exterior Color: ${vehicle.color}
        - Registered Province/State: ${vehicle.province}
        - VIN: ${vehicle.vin}

        Equipment & Features:
        - Transmission: ${vehicle.transmission || 'N/A'}
        - Drivetrain: ${vehicle.drivetrain || 'N/A'}
        - Engine: ${engineDescription || 'N/A'}
        - Fuel Type: ${vehicle.fuelType || 'N/A'}
        - Key Features: ${vehicle.features.length > 0 ? vehicle.features.join(', ') : 'Not specified'}

        Service History & Key Notes:
        ${vehicle.serviceHistory || 'No specific service history notes provided.'}

        Generate a simple description now.
    `;

    const validPhotos = vehicle.photos.filter((p): p is string => p !== null);
    const allFileDataUrls = [...validPhotos, ...(vehicle.serviceHistoryPhotos || [])];

    const fileParts = allFileDataUrls.map(dataUrl => {
        const parts = dataUrl.split(',');
        if (parts.length !== 2) {
            console.warn('Skipping malformed data URL');
            return null;
        }
        const [header, data] = parts;
        const mimeTypeMatch = header.match(/:(.*?);/);
        if (!mimeTypeMatch || !mimeTypeMatch[1]) {
            console.warn('Could not extract mimeType from data URL');
            return null;
        }
        return {
            inlineData: {
                mimeType: mimeTypeMatch[1],
                data,
            },
        };
    }).filter((part): part is { inlineData: { mimeType: string; data: string; }; } => part !== null);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, ...fileParts] },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating description with Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};