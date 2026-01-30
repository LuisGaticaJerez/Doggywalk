import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'pet-service-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadPhoto(
  folderPath: string,
  file: File,
  maxSize: number = MAX_FILE_SIZE
): Promise<string> {
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }

  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const fileName = `${folderPath}/${timestamp}-${random}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

  return publicUrl;
}

export async function deletePhoto(photoUrl: string): Promise<void> {
  const path = photoUrl.split(`${BUCKET_NAME}/`)[1];
  if (!path) {
    throw new Error('Invalid photo URL');
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    throw error;
  }
}

export async function storePhoto(file: File): Promise<string> {
  const compressed = await compressImage(file);
  return uploadPhoto('service-photos', compressed);
}

export function compressImage(file: File, maxWidth = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          0.85
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}
