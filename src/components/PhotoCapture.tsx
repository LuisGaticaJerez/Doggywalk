import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { compressImage, uploadPhoto } from '../utils/photoStorage';

interface PhotoCaptureProps {
  onPhotoUploaded: (url: string) => void;
  folder: string;
  disabled?: boolean;
}

export default function PhotoCapture({
  onPhotoUploaded,
  folder,
  disabled = false
}: PhotoCaptureProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (disabled) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return;
    }

    setUploading(true);

    try {
      const compressed = await compressImage(file);
      const imageUrl = await uploadPhoto(folder, compressed);
      onPhotoUploaded(imageUrl);
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      <button
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={disabled || uploading}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: uploading
            ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
            : isDragging
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          color: 'white',
          border: isDragging ? '3px dashed white' : 'none',
          fontSize: '28px',
          cursor: (disabled || uploading) ? 'not-allowed' : 'pointer',
          boxShadow: isDragging
            ? '0 8px 32px rgba(16, 185, 129, 0.6)'
            : '0 8px 24px rgba(59, 130, 246, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          opacity: disabled ? 0.6 : 1
        }}
        title={uploading ? 'Uploading photo...' : 'Take or upload a photo'}
      >
        {uploading ? (
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          '📸'
        )}
      </button>

      {isDragging && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            background: 'rgba(16, 185, 129, 0.95)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            zIndex: 999,
            pointerEvents: 'none'
          }}
        >
          Drop photo here!
        </div>
      )}
    </>
  );
}
