// File: api/generate-description.ts (Serverless Function)

import { GoogleGenAI } from "@google/genai";
// You may need to install the Vercel-specific types if you're using TypeScript:
// npm install --save-dev @vercel/node
import type { VercelRequest, VercelResponse } from '@vercel/node'; 
import { Vehicle } from '../types'; // Assuming types are accessible

// Initialize the AI client using the API key from Vercel Environment Variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

// This is the Vercel Serverless Function Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    
    // 1. Basic validation
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    // 2. Extract vehicle data from the client's request body
    const vehicle: Omit<Vehicle, 'description' | 'id' | 'createdAt'> = req.body;

    // --- PASTE ALL YOUR LOGIC BELOW HERE ---

    const engineDescription = [
        vehicle.engineCylinders ? `${vehicle.engineCylinders} cylinders` : '',
        vehicle.displacement ? `${vehicle.displacement}L` : ''
    ].filter(Boolean).join(' / ');
    
    const prompt = `
        You are an AI assistant creating a vehicle summary.
        // ... (rest of your detailed prompt here) ...
    `;

    const validPhotos = vehicle.photos.filter((p): p is string => p !== null);
    const allFileDataUrls = [...validPhotos, ...(vehicle.serviceHistoryPhotos || [])];

    // ... (rest of your fileParts creation logic here) ...
    
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