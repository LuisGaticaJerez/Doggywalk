import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ValidationRequest {
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
  documentData: {
    documentType: string;
    documentNumber: string;
    fullName: string;
    dateOfBirth: string;
    nationality: string;
  };
}

interface ValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
  extractedData?: {
    documentNumber?: string;
    fullName?: string;
    dateOfBirth?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { documentFrontUrl, documentBackUrl, selfieUrl, documentData }: ValidationRequest = await req.json();

    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 0;

    const validations = await Promise.all([
      validateImageQuality(documentFrontUrl),
      documentBackUrl ? validateImageQuality(documentBackUrl) : Promise.resolve({ valid: true, score: 1 }),
      validateImageQuality(selfieUrl),
      validateDocumentStructure(documentFrontUrl, documentData.documentType),
    ]);

    const [frontValidation, backValidation, selfieValidation, structureValidation] = validations;

    if (!frontValidation.valid) {
      errors.push('La imagen frontal del documento no tiene la calidad suficiente');
      confidence -= 20;
    } else {
      confidence += frontValidation.score * 30;
    }

    if (documentBackUrl && !backValidation.valid) {
      errors.push('La imagen trasera del documento no tiene la calidad suficiente');
      confidence -= 20;
    } else {
      confidence += backValidation.score * 20;
    }

    if (!selfieValidation.valid) {
      errors.push('La selfie no tiene la calidad suficiente o no se detecta un rostro');
      confidence -= 30;
    } else {
      confidence += selfieValidation.score * 30;
    }

    if (!structureValidation.valid) {
      errors.push(structureValidation.error || 'El documento no parece ser válido');
      confidence -= 20;
    } else {
      confidence += 20;
    }

    const extractedData = await extractTextFromDocument(documentFrontUrl, documentData.documentType);

    if (extractedData.documentNumber) {
      const similarity = calculateSimilarity(
        cleanString(extractedData.documentNumber),
        cleanString(documentData.documentNumber)
      );

      if (similarity < 0.6) {
        errors.push('El número de documento ingresado no coincide con el de la imagen');
        confidence -= 30;
      } else if (similarity < 0.8) {
        warnings.push('El número de documento tiene una coincidencia parcial. Verifica que sea correcto.');
        confidence -= 10;
      } else {
        confidence += 20;
      }
    }

    if (extractedData.fullName) {
      const similarity = calculateSimilarity(
        cleanString(extractedData.fullName),
        cleanString(documentData.fullName)
      );

      if (similarity < 0.5) {
        errors.push('El nombre ingresado no coincide con el del documento');
        confidence -= 30;
      } else if (similarity < 0.7) {
        warnings.push('El nombre tiene una coincidencia parcial. Verifica que sea correcto.');
        confidence -= 10;
      } else {
        confidence += 20;
      }
    }

    confidence = Math.max(0, Math.min(100, confidence));

    const isValid = errors.length === 0 && confidence >= 60;

    if (!isValid && errors.length === 0) {
      errors.push('La validación automática no alcanzó el nivel de confianza mínimo (60%). Un administrador revisará manualmente tu solicitud.');
    }

    return new Response(
      JSON.stringify({
        isValid,
        errors,
        warnings,
        confidence,
        extractedData,
      } as ValidationResponse),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error validating document:", error);
    return new Response(
      JSON.stringify({
        isValid: false,
        errors: ["Error al validar el documento. Por favor intenta de nuevo."],
        warnings: [],
        confidence: 0,
      } as ValidationResponse),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function validateImageQuality(imageUrl: string): Promise<{ valid: boolean; score: number }> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { valid: false, score: 0 };
    }

    const blob = await response.blob();

    if (blob.size < 50000) {
      return { valid: false, score: 0 };
    }

    if (blob.size > 10000000) {
      return { valid: false, score: 0 };
    }

    let score = 1;
    if (blob.size < 100000) score = 0.6;
    else if (blob.size < 300000) score = 0.8;

    return { valid: true, score };
  } catch (error) {
    console.error('Error validating image quality:', error);
    return { valid: false, score: 0 };
  }
}

async function validateDocumentStructure(
  imageUrl: string,
  documentType: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { valid: false, error: 'No se pudo cargar la imagen del documento' };
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const keywords = getDocumentKeywords(documentType);

    return { valid: true };
  } catch (error) {
    console.error('Error validating document structure:', error);
    return { valid: false, error: 'Error al analizar la estructura del documento' };
  }
}

function getDocumentKeywords(documentType: string): string[] {
  const keywords: Record<string, string[]> = {
    national_id: ['cedula', 'identidad', 'rut', 'nacional', 'republica', 'chile'],
    passport: ['passport', 'pasaporte', 'passport', 'travel', 'viaje'],
    driver_license: ['licencia', 'conducir', 'conductor', 'license', 'driver'],
  };

  return keywords[documentType] || [];
}

async function extractTextFromDocument(
  imageUrl: string,
  documentType: string
): Promise<{ documentNumber?: string; fullName?: string; dateOfBirth?: string }> {
  try {
    return {
      documentNumber: undefined,
      fullName: undefined,
      dateOfBirth: undefined,
    };
  } catch (error) {
    console.error('Error extracting text:', error);
    return {};
  }
}

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
