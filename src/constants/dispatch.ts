/**
 * Centralized contact and dispatch constants for Allô Dabou
 */

export const DISPATCH_PHONE = '0101682535';
export const DISPATCH_PHONE_DISPLAY = '01 01 68 25 35';
export const DISPATCH_PHONE_INTL = '+2250101682535';
export const DISPATCH_WHATSAPP_BASE = 'https://wa.me/2250101682535';

export function getDispatchWhatsAppUrl(message?: string): string {
  if (!message) {
    return `${DISPATCH_WHATSAPP_BASE}?text=${encodeURIComponent("Bonjour Dispatch Allô Dabou, j'ai besoin d'assistance.")}`;
  }
  return `${DISPATCH_WHATSAPP_BASE}?text=${encodeURIComponent(message)}`;
}

export function getDriverValidationWhatsAppUrl(params: {
  displayName: string;
  phone: string;
  driverCode?: string;
  vehicleType?: string;
  vehicleNumber?: string;
}): string {
  const codeStr = params.driverCode ? ` [Code: ${params.driverCode}]` : '';
  const vehicleStr = params.vehicleType ? `, Véhicule: ${params.vehicleType} ${params.vehicleNumber || ''}` : '';
  const text = `Bonjour Dispatch Allô Dabou, je vous contacte pour la validation de mon compte chauffeur${codeStr} : ${params.displayName} (Tél: ${params.phone}${vehicleStr}).`;
  return `${DISPATCH_WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;
}

export function getDriverDisputeWhatsAppUrl(params: {
  displayName: string;
  driverCode?: string;
  phone: string;
  subject: string;
}): string {
  const codeStr = params.driverCode ? ` [Code: ${params.driverCode}]` : '';
  const text = `Bonjour Direction Allô Dabou, je vous contacte au sujet de mon compte chauffeur${codeStr} : ${params.displayName} (Tél: ${params.phone}) - Objet: ${params.subject}.`;
  return `${DISPATCH_WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;
}
