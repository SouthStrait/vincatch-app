import { db } from '../services/firebase';
import React from 'react';
import CameraIcon from './icons/CameraIcon';

interface PhotoUploadSlotProps {
  label: string;
  previewUrl: string | null;
  index: number;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  onRemove: (index: number) => void;
  onTakePhotoRequest: (index: number) => void;
}

const PhotoUploadSlot: React.FC<PhotoUploadSlotProps> = ({ label, previewUrl, index, onPhotoChange, onRemove, onTakePhotoRequest }) => {
  const inputId = `file-upload-${index}`;
  const supportsCamera = typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;


  return (
    <div className="relative group aspect-[4/3] bg-gray-950 border-2 border-gray-700 border-dashed rounded-lg flex items-center justify-center text-center transition-all duration-300 hover:border-orange-500 hover:bg-gray-900">
      {previewUrl ? (
        <>
          <img src={previewUrl} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded-full p-1 z-10"
              aria-label={`Remove ${label} photo`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="absolute bottom-0 w-full text-xs font-semibold text-white bg-black bg-opacity-70 py-1">{label}</p>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-1 text-neutral-500 w-full h-full">
            <span className="text-xs font-semibold mb-2">{label}</span>
            <div className="flex items-center space-x-2">
                <label htmlFor={inputId} className="cursor-pointer p-2 rounded-full hover:bg-gray-800 hover:text-orange-400 transition-colors" title="Upload file">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </label>
                <input id={inputId} name={inputId} type="file" className="sr-only" accept="image/*" onChange={(e) => onPhotoChange(e, index)} />
                {supportsCamera && (
                    <button type="button" onClick={() => onTakePhotoRequest(index)} className="cursor-pointer p-2 rounded-full hover:bg-gray-800 hover:text-orange-400 transition-colors" title="Take photo">
                        <CameraIcon className="h-6 w-6" />
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadSlot;