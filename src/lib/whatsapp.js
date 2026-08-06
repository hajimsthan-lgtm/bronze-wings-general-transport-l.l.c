export function whatsappUrl(phone, message = '') {
  const clean = (phone || '').replace(/[^0-9]/g, '');
  const normalized = clean.startsWith('0') ? '971' + clean.slice(1) : clean;
  return `https://wa.me/${normalized}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}