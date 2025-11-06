import React, { useState, useEffect } from 'react';

interface PhotoGalleryProps {
  photos: (string | null)[];
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  const validPhotos = photos.filter((p): p is string => p !== null);
  const [mainPhoto, setMainPhoto] = useState(validPhotos[0] || null);
  
  useEffect(() => {
    // Reset main photo if photos array changes (e.g., after an edit)
    const newValidPhotos = photos.filter((p): p is string => p !== null);
    setMainPhoto(newValidPhotos[0] || null);
  }, [photos]);


  if (!mainPhoto || validPhotos.length === 0) {
    return <div className="text-center text-neutral-500 h-64 md:h-96 flex items-center justify-center bg-gray-950 rounded-lg border border-gray-800">No photos available.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
        <img
          src={mainPhoto}
          alt="Main vehicle view"
          className="w-full h-64 md:h-96 object-cover transition-transform duration-300 ease-in-out"
        />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {validPhotos.map((photo, index) => (
          <div
            key={index}
            onClick={() => setMainPhoto(photo)}
            className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all duration-200 ${
              mainPhoto === photo ? 'border-orange-500 scale-105' : 'border-gray-700 hover:border-orange-400'
            }`}
          >
            <img
              src={photo}
              alt={`Vehicle thumbnail ${index + 1}`}
              className="w-full h-16 md:h-20 object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;