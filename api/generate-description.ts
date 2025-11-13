// File: api/generate-description.ts (Serverless Function)

import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node'; 
import { Vehicle } from '../types'; // Assuming Vehicle type is accessible

// 1. Get the API key value from the environment variables
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// 2. Initialize the AI client outside the handler to improve performance (reuse across requests)
// The SDK will now explicitly use the GEMINI_KEY value.
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY }); 

// This is the Vercel Serverless Function Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    
    // 1. Basic validation and error checking
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    // Check if the key is null/undefined at runtime (CRITICAL CHECK)
    if (!GEMINI_KEY) {
        console.error("CRITICAL ERROR: GEMINI_API_KEY is not available in the Vercel environment.");
        return res.status(500).json({ message: "Server configuration error: Missing API Key in environment variables." });
    }
    
    // 2. Extract vehicle data from the client's request body
    const vehicle: Omit<Vehicle, 'description' | 'id' | 'createdAt'> = req.body;

    // --- LOGIC: BUILD PROMPT AND PARSE IMAGE DATA ---

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

    // DEFINITION OF fileParts (Fixes TS2304 error)
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
    
    // 3. Call the Gemini API
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, ...fileParts] },
        });

        // SUCCESS: Send the description back to the client
        return res.status(200).json({ description: response.text });
        
    } catch (error) {
        console.error("Error generating description with Gemini API:", error);
        
        // ERROR: Send a proper error response back to the client
        return res.status(500).json({ message: "Failed to communicate with the AI model." });
    }
}