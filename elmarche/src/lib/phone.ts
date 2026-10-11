// Returns the number in international format (+213551234567), or null if it is not valid.
// Algerian numbers must be mobile (05, 06, 07) because WhatsApp needs a mobile line.
export function normalizePhone(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s().-]/g, "");

  if (/^0[567]\d{8}$/.test(cleaned)) return `+213${cleaned.slice(1)}`;

  const international = (cleaned.startsWith("00") ? `+${cleaned.slice(2)}` : cleaned).replace(
    /^\+2130/,
    "+213",
  );
  if (/^\+[1-9]\d{7,14}$/.test(international)) return international;

  return null;
}