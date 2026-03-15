import { Translations } from '../translations/en';

export type ErrorType = 'error' | 'warning' | 'info';

export interface AppError {
  message: string;
  type: ErrorType;
  code?: string;
}

export function handleError(error: unknown, t: Translations, fallbackMessage?: string): AppError {
  console.error('Error occurred:', error);

  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage || t.common.error,
      type: 'error',
      code: (error as any).code
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      type: 'error'
    };
  }

  if (error && typeof error === 'object') {
    const err = error as any;

    if (err.message) {
      return {
        message: err.message,
        type: 'error',
        code: err.code
      };
    }

    if (err.error) {
      return {
        message: err.error,
        type: 'error'
      };
    }
  }

  return {
    message: fallbackMessage || t.common.error,
    type: 'error'
  };
}

export function getSupabaseErrorMessage(error: any, t: Translations): string {
  if (!error) return t.common.error;

  const errorCode = error.code || error.error_code;

  switch (errorCode) {
    case '23505':
      return t.errors.duplicateEntry || 'This record already exists';
    case '23503':
      return t.errors.referenceError || 'Related record not found';
    case '42501':
      return t.errors.permissionDenied || 'Permission denied';
    case 'PGRST116':
      return t.errors.notFound || 'Record not found';
    default:
      return error.message || error.error || t.common.error;
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch') ||
           error.message.toLowerCase().includes('connection');
  }
  return false;
}

export function shouldRetry(error: unknown): boolean {
  return isNetworkError(error);
}
