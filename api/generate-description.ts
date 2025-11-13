// File: api/generate-description.ts (Serverless Function)

import { GoogleGenAI } from "@google/genai";
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

    // --- LOGIC STARTS HERE ---

    const engineDescription = [
        vehicle.engineCylinders ? `${vehicle.engineCylinders} cylinders` : '',
        vehicle.displacement ? `${vehicle.displacement}L` : ''
    ].filter(Boolean).join(' / ');
    
    const prompt = `
        You are an AI assistant creating a vehicle summary.
        Based on the following vehicle details, images, and any attached service documents, generate a clear, concise, and factual description for a potential buyer.
        Focus on key features, condition, and recent maintenance mentioned in the service history.
        Avoid sales jargon and overly enthusiastic language. The goal is a straightforward summary. Do not use markdown.
        // ... (rest of your detailed prompt here) ...
    `;

    const validPhotos = vehicle.photos.filter((p): p is string => p !== null);
    const allFileDataUrls = [...validPhotos, ...(vehicle.serviceHistoryPhotos || [])];

    // ----------------------------------------------------------------------
    // 🔥 MISSING CODE BLOCK - THIS DEFINES 'fileParts' AND FIXES THE ERROR
    // ----------------------------------------------------------------------
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
    // ----------------------------------------------------------------------
    
    // 3. Call the Gemini API
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, ...fileParts] }, // <--- fileParts is now defined
        });

        // SUCCESS: Send the description back to the client
        return res.status(200).json({ description: response.text });
        
    } catch (error) {
        console.error("Error generating description with Gemini API:", error);
        
        // ERROR: Send a proper error response back to the client
        return res.status(500).json({ message: "Failed to communicate with the AI model." });
    }
}