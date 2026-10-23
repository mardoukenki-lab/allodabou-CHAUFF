/**
 * Phone number utilities for Côte d'Ivoire and Allô Dabou
 */

export function normalizeIvorianPhone(input: string): string {
  if (!input) return '';
  // Extract only digits
  let digits = input.replace(/\D/g, '');

  // Strip international prefixes: 00225 or 225
  if (digits.startsWith('00225')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('225') && digits.length >= 11) {
    digits = digits.slice(3);
  }

  return digits;
}

export function isValidIvorianPhone(phone: string): boolean {
  const normalized = normalizeIvorianPhone(phone);
  // Standard CI phone numbers are 10 digits (or legacy 8 digits)
  return normalized.length >= 8 && normalized.length <= 10;
}

export function formatIvorianPhone(phone: string): string {
  const norm = normalizeIvorianPhone(phone);
  if (norm.length === 10) {
    // 07 08 09 10 11
    return norm.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  if (norm.length === 8) {
    // 08 09 10 11
    return norm.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
  return phone.trim();
}

export function getDriverAuthEmail(phoneOrEmail: string): string {
  const trimmed = phoneOrEmail.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const cleanPhone = normalizeIvorianPhone(trimmed);
  return `${cleanPhone}@driver.allodabou.ci`;
}
