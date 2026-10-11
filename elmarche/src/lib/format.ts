const priceFormatter = new Intl.NumberFormat("en-US");

export function formatPrice(priceDzd: number): string {
  return `${priceFormatter.format(priceDzd)} DA`;
}

// Builds a WhatsApp "click to chat" link. Accepts +213..., 00213... or a local 0... number.
export function whatsappLink(rawNumber: string, productTitle: string): string | null {
  let digits = rawNumber.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `213${digits.slice(1)}`;
  if (digits.length < 8) return null;

  const text = `Bonjour, je suis intéressé(e) par « ${productTitle} » sur El Marché.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}