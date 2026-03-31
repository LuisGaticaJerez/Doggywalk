export function validateChileanRUT(rut: string): boolean {
  const cleanRUT = rut.replace(/[.-]/g, '');

  if (cleanRUT.length < 2) return false;

  const body = cleanRUT.slice(0, -1);
  const verifier = cleanRUT.slice(-1).toLowerCase();

  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const calculatedVerifier = remainder === 0 ? '0' : remainder === 1 ? 'k' : String(11 - remainder);

  return verifier === calculatedVerifier;
}

export function formatChileanRUT(rut: string): string {
  const cleanRUT = rut.replace(/[.-]/g, '');
  if (cleanRUT.length < 2) return rut;

  const body = cleanRUT.slice(0, -1);
  const verifier = cleanRUT.slice(-1);

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${verifier}`;
}

export function validateDocumentNumber(documentType: string, documentNumber: string, nationality: string): { valid: boolean; error?: string } {
  if (!documentNumber || documentNumber.trim().length === 0) {
    return { valid: false, error: 'El número de documento es requerido' };
  }

  if (documentType === 'national_id' && (nationality.toLowerCase().includes('chil') || nationality.toLowerCase() === 'cl')) {
    if (!validateChileanRUT(documentNumber)) {
      return { valid: false, error: 'RUT chileno inválido. Formato esperado: 12.345.678-9 o 12345678-9' };
    }
  }

  if (documentType === 'passport') {
    if (documentNumber.length < 6 || documentNumber.length > 12) {
      return { valid: false, error: 'El número de pasaporte debe tener entre 6 y 12 caracteres' };
    }
    if (!/^[A-Z0-9]+$/i.test(documentNumber)) {
      return { valid: false, error: 'El número de pasaporte solo puede contener letras y números' };
    }
  }

  if (documentType === 'driver_license') {
    if (documentNumber.length < 6 || documentNumber.length > 20) {
      return { valid: false, error: 'El número de licencia debe tener entre 6 y 20 caracteres' };
    }
  }

  return { valid: true };
}

export function validateDateOfBirth(dateString: string): { valid: boolean; error?: string } {
  if (!dateString) {
    return { valid: false, error: 'La fecha de nacimiento es requerida' };
  }

  const date = new Date(dateString);
  const today = new Date();

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Fecha inválida' };
  }

  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

  if (actualAge < 18) {
    return { valid: false, error: 'Debes ser mayor de 18 años para registrarte como proveedor' };
  }

  if (actualAge > 100) {
    return { valid: false, error: 'Por favor verifica la fecha de nacimiento' };
  }

  if (date > today) {
    return { valid: false, error: 'La fecha de nacimiento no puede ser en el futuro' };
  }

  return { valid: true };
}

export function validateExpiryDate(dateString: string): { valid: boolean; error?: string } {
  if (!dateString) {
    return { valid: true };
  }

  const date = new Date(dateString);
  const today = new Date();

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Fecha de expiración inválida' };
  }

  if (date < today) {
    return { valid: false, error: 'El documento está vencido. Por favor usa un documento válido.' };
  }

  return { valid: true };
}

export function validateFullName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length < 3) {
    return { valid: false, error: 'El nombre debe tener al menos 3 caracteres' };
  }

  if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(name)) {
    return { valid: false, error: 'El nombre solo puede contener letras y espacios' };
  }

  const words = name.trim().split(/\s+/);
  if (words.length < 2) {
    return { valid: false, error: 'Por favor ingresa tu nombre completo (nombre y apellido)' };
  }

  return { valid: true };
}

export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Solo se aceptan imágenes en formato JPG, PNG o HEIC' };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'La imagen no puede superar los 10 MB' };
  }

  const minSize = 50 * 1024;
  if (file.size < minSize) {
    return { valid: false, error: 'La imagen es muy pequeña. Asegúrate de que sea de buena calidad.' };
  }

  try {
    const imageValidation = await validateImageDimensions(file);
    if (!imageValidation.valid) {
      return imageValidation;
    }
  } catch (error) {
    return { valid: false, error: 'Error al validar la imagen' };
  }

  return { valid: true };
}

async function validateImageDimensions(file: File): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const minWidth = 600;
      const minHeight = 400;

      if (img.width < minWidth || img.height < minHeight) {
        resolve({
          valid: false,
          error: `La imagen debe tener al menos ${minWidth}x${minHeight} píxeles para garantizar la legibilidad`
        });
      } else {
        resolve({ valid: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: 'No se pudo cargar la imagen' });
    };

    img.src = url;
  });
}

export async function validateDocumentImage(file: File, documentType: 'front' | 'back' | 'selfie'): Promise<{ valid: boolean; error?: string }> {
  const basicValidation = await validateImageFile(file);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  if (documentType === 'selfie') {
    return await validateSelfieImage(file);
  }

  return { valid: true };
}

async function validateSelfieImage(file: File): Promise<{ valid: boolean; error?: string }> {
  const basicValidation = await validateImageFile(file);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  return { valid: true };
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAllDocumentData(data: {
  documentType: string;
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  expiryDate?: string;
}): DocumentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nameValidation = validateFullName(data.fullName);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error!);
  }

  const docNumberValidation = validateDocumentNumber(data.documentType, data.documentNumber, data.nationality);
  if (!docNumberValidation.valid) {
    errors.push(docNumberValidation.error!);
  }

  const dobValidation = validateDateOfBirth(data.dateOfBirth);
  if (!dobValidation.valid) {
    errors.push(dobValidation.error!);
  }

  if (data.expiryDate) {
    const expiryValidation = validateExpiryDate(data.expiryDate);
    if (!expiryValidation.valid) {
      errors.push(expiryValidation.error!);
    }

    const expiryDate = new Date(data.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (expiryDate < threeMonthsFromNow) {
      warnings.push('Tu documento vencerá pronto. Considera renovarlo.');
    }
  }

  if (!data.nationality || data.nationality.trim().length < 2) {
    errors.push('La nacionalidad es requerida');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
