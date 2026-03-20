import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface FaceCaptureOptionProps {
  faceImageUrl: string | null;
  onFaceImageChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

const FaceCaptureOption: React.FC<FaceCaptureOptionProps> = ({
  faceImageUrl,
  onFaceImageChange,
  disabled = false,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && activeStream) {
      video.srcObject = activeStream;
      video.play().catch(() => {});
    }
  }, [activeStream]);

  const stopCamera = useCallback(() => {
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      setActiveStream(null);
    }
    setIsCameraActive(false);
  }, [activeStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 512 }, height: { ideal: 512 } },
      });
      setActiveStream(stream);
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert("Could not access camera. Please ensure you've granted permissions.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    canvas.width = 512;
    canvas.height = 512;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 512, 512);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onFaceImageChange(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) onFaceImageChange(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemove = () => {
    onFaceImageChange(null);
    stopCamera();
  };

  return (
    <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-700/40">
      <p className="text-sm font-medium text-amber-200 mb-2">Upload or take a photo of your face (optional — for face-swap portrait)</p>
      <div className="flex flex-wrap gap-2 items-center">
        {!faceImageUrl && !isCameraActive && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-medium text-sm rounded-lg border border-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImageIcon size={16} />
              Upload Photo
            </button>
            <button
              type="button"
              onClick={startCamera}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-medium text-sm rounded-lg border border-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={16} />
              Take Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        )}
        {isCameraActive && (
          <div className="flex flex-col gap-2 w-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-32 h-32 object-cover rounded-lg border border-amber-700/50"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {faceImageUrl && !isCameraActive && (
          <div className="flex items-center gap-2">
            <img
              src={faceImageUrl}
              alt="Face reference"
              className="w-12 h-12 object-cover rounded-lg border border-amber-700/50"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors disabled:opacity-50"
              title="Remove face reference"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FaceCaptureOption;
