export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return cleaned;

  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);

  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut);

  if (cleaned.length < 2) return false;

  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);

  if (!/^\d+$/.test(number)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = number.length - 1; i >= 0; i--) {
    sum += parseInt(number[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const calculatedDv = 11 - remainder;

  let expectedDv: string;
  if (calculatedDv === 11) {
    expectedDv = '0';
  } else if (calculatedDv === 10) {
    expectedDv = 'K';
  } else {
    expectedDv = calculatedDv.toString();
  }

  return dv === expectedDv;
}

export function getRutError(rut: string): string | null {
  const cleaned = cleanRut(rut);

  if (!cleaned) {
    return 'El RUT es requerido';
  }

  if (cleaned.length < 8) {
    return 'El RUT es demasiado corto';
  }

  if (cleaned.length > 9) {
    return 'El RUT es demasiado largo';
  }

  if (!validateRut(rut)) {
    return 'El RUT no es válido';
  }

  return null;
}