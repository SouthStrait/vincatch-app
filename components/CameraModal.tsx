import { db } from '../services/firebase';
import React, { useState, useRef, useEffect } from 'react';

interface CameraModalProps {
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported on this browser.');
        }
        cleanupStream(); // Clean up any previous stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions and try again.");
      }
    };
    
    startCamera();

    return cleanupStream;
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        cleanupStream(); // Stop stream after capture
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsStreaming(true);
          }
        } catch (err) {
          setError("Could not restart camera.");
        }
      };
    startCamera();
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-900 p-4 rounded-lg shadow-xl w-full max-w-lg mx-4 border border-gray-800">
        <h3 className="text-xl font-bold text-neutral-100 mb-4">{capturedImage ? "Preview" : "Take Photo"}</h3>
        
        {error && <p className="text-red-400 text-center my-4">{error}</p>}

        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            {capturedImage ? (
                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
            ) : (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            )}
             {!isStreaming && !capturedImage && !error && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
             )}
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        <div className="mt-4 flex justify-center space-x-4">
          {capturedImage ? (
            <>
              <button onClick={handleRetake} className="flex-1 py-2 px-4 border border-gray-700 rounded-lg text-sm font-medium text-neutral-300 bg-gray-800 hover:bg-gray-700 transition duration-200">
                Retake
              </button>
              <button onClick={handleUsePhoto} className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition duration-200">
                Use Photo
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 py-2 px-4 border border-gray-700 rounded-lg text-sm font-medium text-neutral-300 bg-gray-800 hover:bg-gray-700 transition duration-200">
                Cancel
              </button>
              <button onClick={handleCapture} disabled={!isStreaming} className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200">
                Capture
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;