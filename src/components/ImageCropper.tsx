import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { createPortal } from 'react-dom';
import { useAlert } from './AlertProvider';

interface ImageCropperProps {
  imageSrc: string;
  aspect: number;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  title?: string;
}

export default function ImageCropper({ imageSrc, aspect, onCropComplete, onCancel, title = "Potong Gambar" }: ImageCropperProps) {
  const { showAlert } = useAlert();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels, 'cropped_image.jpg');
      if (croppedImageFile) {
        onCropComplete(croppedImageFile);
      }
    } catch (e) {
      console.error(e);
      showAlert('Gagal memotong gambar', 'error');
    }
    setIsProcessing(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col">
      <div className="bg-red-800 text-white p-4 flex justify-between items-center shadow-lg relative z-10">
        <h3 className="font-bold text-lg">{title}</h3>
        <button onClick={onCancel} className="bg-red-950/50 hover:bg-red-950 p-2 rounded-full transition">
          <span className="material-icons text-white block">close</span>
        </button>
      </div>

      <div className="relative flex-1 bg-black overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={setZoom}
        />
      </div>

      <div className="bg-slate-900 p-6 flex flex-col gap-4 relative z-10">
        <div className="flex items-center gap-4 text-white">
          <span className="material-icons text-sm">zoom_out</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => {
              setZoom(Number(e.target.value));
            }}
            className="w-full accent-red-600 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="material-icons text-sm">zoom_in</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold transition hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2"
          >
            <span className="material-icons">cancel</span> Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold transition hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-icons">check_circle</span> {isProcessing ? 'Memproses...' : 'Selesai & Simpan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
