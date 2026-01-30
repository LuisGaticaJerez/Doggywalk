import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { compressImage, uploadPhoto } from '../utils/photoStorage';
import { useI18n } from '../contexts/I18nContext';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string;
  folder?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export default function ImageUpload({
  onUploadComplete,
  currentImageUrl,
  folder = 'general',
  maxSizeMB = 5,
  disabled = false
}: ImageUploadProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, or WebP image.');
      return false;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = async (file: File) => {
    if (!validateFile(file) || disabled) return;

    setUploading(true);
    setError(null);

    try {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      const compressed = await compressImage(file);
      const imageUrl = await uploadPhoto(folder, compressed);

      URL.revokeObjectURL(previewUrl);
      setPreview(imageUrl);
      onUploadComplete(imageUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

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
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging
            ? '3px dashed #FF8C42'
            : preview
            ? '2px solid #e2e8f0'
            : '2px dashed #e2e8f0',
          borderRadius: '12px',
          padding: preview ? '0' : '32px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragging
            ? '#FFF9E6'
            : uploading
            ? '#f8fafc'
            : 'white',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'hidden',
          minHeight: preview ? 'auto' : '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {uploading ? (
          <div style={{ padding: '32px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid #FFE5B4',
                borderTopColor: '#FF8C42',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}
            />
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
              {t.common.uploading}...
            </p>
          </div>
        ) : preview ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '300px',
                objectFit: 'cover',
                borderRadius: '12px'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {t.common.clickToChange}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📸</div>
            <p
              style={{
                color: '#334155',
                fontSize: '15px',
                fontWeight: '600',
                marginBottom: '8px'
              }}
            >
              {t.common.dragDropImage}
            </p>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
              {t.common.orClickToSelect}
            </p>
            <div
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)'
              }}
            >
              {t.common.selectFile}
            </div>
            <p
              style={{
                color: '#94a3b8',
                fontSize: '12px',
                marginTop: '12px'
              }}
            >
              JPG, PNG, WebP • Max {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
