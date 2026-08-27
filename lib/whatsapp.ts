export function formatIDR(n: number): string {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

export function normalizeWaNumber(input: string): string {
  let n = (input || '').replace(/\D/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  if (!n.startsWith('62')) n = '62' + n;
  return n;
}

export function buildWhatsAppLink(opts: {
  waNumber: string;
  storeName: string;
  orderCode: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  paymentNote?: string;
}): string {
  const num = normalizeWaNumber(opts.waNumber);
  const lines = [
    `Halo, saya mau order dari *${opts.storeName}*`,
    '',
    `*Pesanan:* #${opts.orderCode}`,
    ...opts.items.map(i => `- ${i.name} x${i.qty} = ${formatIDR(i.price * i.qty)}`),
    '',
    `*Total:* ${formatIDR(opts.total)}`,
    `*Nama:* ${opts.customerName}`,
    `*No. HP:* ${opts.phone}`,
    `*Alamat:* ${opts.address}`,
  ];
  if (opts.notes) lines.push(`*Catatan:* ${opts.notes}`);
  if (opts.paymentNote) lines.push(`*Pembayaran:* ${opts.paymentNote}`);
  lines.push('', 'Mohon konfirmasinya, terima kasih!');
  return `https://wa.me/${num}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function generateOrderCode(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${t}-${r}`;
}
