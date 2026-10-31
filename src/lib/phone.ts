/**
 * US phone numbers (NANP).
 * Accepts (408) 555-0123, 408-555-0123, 4085550123, +1 408 555 0123, 14085550123 → returns +14085550123
 */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  let local = '';
  if (/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) local = digits;
  else if (/^1[2-9]\d{2}[2-9]\d{6}$/.test(digits)) local = digits.slice(1);
  else return null;
  return `+1${local}`;
}

/** +14085550123 or 4085550123 → (408) 555-0123 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const e164 = normalisePhone(phone) ?? phone;
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : phone;
}

/** tel: link for a phone number. */
export function telLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return `tel:${normalisePhone(phone) ?? phone.replace(/[^\d+]/g, '')}`;
}

/** WhatsApp link for a phone number, optionally with a pre-filled message. */
export function whatsappLink(phone: string | null | undefined, text?: string): string | null {
  if (!phone) return null;
  const n = (normalisePhone(phone) ?? phone).replace(/[^\d]/g, '');
  if (n.length < 10) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
