import React, { useState, useEffect } from 'react';

// Define the PhotoMetadata type structure locally if it's not imported,
// or ensure you import it from '../types' if that's where it lives.
// Assuming PhotoMetadata is { downloadURL: string; ... }
interface PhotoMetadata {
    downloadURL: string;
    // We only need downloadURL for rendering the image source
}

// 🛑 UPDATED PROP TYPE: Component now correctly expects PhotoMetadata objects
interface PhotoGalleryProps {
  photos: PhotoMetadata[] | null; 
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  
  // 1. Filter out nulls and ensure we have only valid PhotoMetadata objects
  const validPhotos = (photos || []).filter((p): p is PhotoMetadata => 
     p !== null && typeof p.downloadURL === 'string'
  );
  
  // 2. Set the main photo state to the first *PhotoMetadata object*
  const [mainPhotoMetadata, setMainPhotoMetadata] = useState<PhotoMetadata | null>(validPhotos[0] || null);
  
  useEffect(() => {
    // Reset main photo if photos array changes (e.g., after an edit)
    const newValidPhotos = (photos || []).filter((p): p is PhotoMetadata => 
        p !== null && typeof p.downloadURL === 'string'
    );
    setMainPhotoMetadata(newValidPhotos[0] || null);
  }, [photos]);


  if (!mainPhotoMetadata || validPhotos.length === 0) {
    return (
        <div className="text-center text-neutral-500 h-64 md:h-96 flex items-center justify-center bg-gray-950 rounded-lg border border-gray-800">
            No photos available.
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
        <img
          // 🛑 FIX: Access the downloadURL property for the main image src
          src={mainPhotoMetadata.downloadURL} 
          alt="Main vehicle view"
          className="w-full h-64 md:h-96 object-cover transition-transform duration-300 ease-in-out"
        />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {validPhotos.map((photoMetadata, index) => (
          <div
            key={index}
            // Update state setter to receive the entire metadata object
            onClick={() => setMainPhotoMetadata(photoMetadata)}
            className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all duration-200 ${
              mainPhotoMetadata === photoMetadata ? 'border-orange-500 scale-105' : 'border-gray-700 hover:border-orange-400'
            }`}
          >
            <img
              // 🛑 FIX: Access the downloadURL property for the thumbnail src
              src={photoMetadata.downloadURL} 
              alt={`Vehicle thumbnail ${index + 1}`}
              className="w-full h-16 md:h-20 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;