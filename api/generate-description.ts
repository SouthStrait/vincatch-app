// File: api/generate-description.ts (Serverless Function)

import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node'; 
// Assuming Vehicle type is defined in your types.ts file
import { Vehicle } from '../types'; 

// IMPORTANT: This initialization will now happen inside the handler
// It's safer for Vercel's dynamic environment.
// const ai = new GoogleGenAI({ apiKey: GEMINI_KEY }); // REMOVED

export default async function handler(req: VercelRequest, res: VercelResponse) {
    
    // 1. Basic validation and API Key check
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_KEY || GEMINI_KEY === 'YOUR_API_KEY_HERE') {
        console.error("CRITICAL ERROR: GEMINI_API_KEY is not available/set.");
        // 💡 Return 401 Unauthorized since the key is missing
        return res.status(401).json({ message: "Server configuration error: Missing or invalid API Key." });
    }
    
    // 2. Initialize AI client inside the handler (safer initialization)
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    // 3. Extract vehicle data (photos and serviceHistoryPhotos should be empty arrays here)
    // Note: We don't need the file parsing logic anymore since files go to Storage first.
    const vehicle: Omit<Vehicle, 'description' | 'id' | 'createdAt'> = req.body;

    // --- LOGIC: BUILD PROMPT ---

    const engineDescription = [
        vehicle.engineCylinders ? `${vehicle.engineCylinders} cylinders` : '',
        vehicle.displacement ? `${vehicle.displacement}L` : ''
    ].filter(Boolean).join(' / ');
    
    // We remove all references to images/documents since they aren't included in the payload
    const prompt = `
        You are an AI assistant creating a vehicle summary.
        Based on the following vehicle details, generate a clear, concise, and factual description for a potential buyer.
        Focus on key features, condition, and maintenance mentioned in the service history.
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

    
    // 4. Call the Gemini API
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt, // Pass the prompt directly since fileParts is no longer needed
        });

        // SUCCESS: Send the description back to the client
        return res.status(200).json({ description: response.text });
        
    } catch (error) {
        console.error("Error generating description with Gemini API:", error);
        
        // ERROR: Send a proper 500 status response back to the client
        return res.status(500).json({ message: "Failed to communicate with the AI model." });
    }
}