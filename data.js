// ================================================================
//  FUNGSI BANTU & DATA AWAL
// ================================================================

// Helper to reverse date format between DD-MM-YYYY and YYYY-MM-DD
function reverseDateFormat(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return parts.reverse().join('-');
  }
  return dateStr; // Return as is if not in expected format
}

// Helper to parse currency strings like "Rp4.000" into numbers
function parseCurrency(str) {
  if (typeof str !== 'string') return 0;
  // Hanya ambil angka dari string, mengabaikan "Rp", titik, spasi, dll.
  const cleaned = str.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

// Helper to parse a single CSV line, handling quoted fields
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current); // Add the last value
  // Trim and remove surrounding quotes from each value
  return result.map(val => val.trim().replace(/^"|"$/g, ''));
}

const rawData = [
  { tanggal: "08-07-2025", kode: "1 pa", nama: "SAFINAH AWALUMA", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 200, kiriman: 1, hargaSatuan: 4000, hargaJual: 8500 },
  { tanggal: "08-07-2025", kode: "1 pa", nama: "MABADI' FIQHIYAH JUZ 1", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 200, kiriman: 1, hargaSatuan: 6000, hargaJual: 9500 },
  { tanggal: "09-07-2025", kode: "2 pa, 2 pi", nama: "HIDAYATUS SHIBYAN", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 200, kiriman: 1, hargaSatuan: 7000, hargaJual: 12500 },
  { tanggal: "08-07-2025", kode: "2 pa", nama: "BAHASA ARAB 1", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 200, kiriman: 1, hargaSatuan: 7000, hargaJual: 11500 },
  { tanggal: "11-07-2025", kode: "3 pa", nama: "AKHLAQUN NISA", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 200, kiriman: 1, hargaSatuan: 7000, hargaJual: 10500 },
  { tanggal: "25-07-2025", kode: "3 pa", nama: "AQIDATUL AWAM", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 200, kiriman: 1, hargaSatuan: 7000, hargaJual: 8500 },
  { tanggal: "26-07-2025", kode: "4 pa", nama: "SULLAMUT TAUFIQ", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 101, kiriman: 1, hargaSatuan: 9000, hargaJual: 10000 },
  { tanggal: "27-07-2025", kode: "4 pa", nama: "RISALAH MUSTAHADLAH", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 101, kiriman: 1, hargaSatuan: 7000, hargaJual: 10000 },
  { tanggal: "28-07-2025", kode: "5 pa", nama: "TUHFATUL ATFAL", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 101, kiriman: 1, hargaSatuan: 7000, hargaJual: 10000 },
  { tanggal: "29-07-2025", kode: "5 pa", nama: "KHULASHOH 1", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 101, kiriman: 1, hargaSatuan: 6000, hargaJual: 10000 },
  { tanggal: "30-07-2025", kode: "6 pa", nama: "BAHASA ARAB 2", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 101, kiriman: 1, hargaSatuan: 7500, hargaJual: 10000 },
  { tanggal: "31-07-2025", kode: "6 pa", nama: "MABADI FIQHIYAH 2", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 101, kiriman: 1, hargaSatuan: 6000, hargaJual: 10000 },
  { tanggal: "01-08-2025", kode: "7 pa", nama: "AKHLAQUL LIL BANAT 1", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 101, kiriman: 1, hargaSatuan: 7000, hargaJual: 10000 },
  { tanggal: "02-08-2025", kode: "7 pa", nama: "DAQAIQUL AKHBAR MDR", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 101, kiriman: 1, hargaSatuan: 18000, hargaJual: 10000 },
  { tanggal: "03-08-2025", kode: "8 pa", nama: "TA'LIM MUTA'ALLIM", supplier: "PT LUMAJANG", gudang: "PA", pesan: 1000, datang: 102, kiriman: 1, hargaSatuan: 8000, hargaJual: 10000 },
  { tanggal: "04-08-2025", kode: "8 pa", nama: "MATNI SYARIF", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 102, kiriman: 1, hargaSatuan: 6500, hargaJual: 10000 },
  { tanggal: "05-08-2025", kode: "8 pa", nama: "JURUMIYAH", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 102, kiriman: 1, hargaSatuan: 6501, hargaJual: 10000 },
  { tanggal: "06-08-2025", kode: "8 pa", nama: "KHULASHOH 2", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 102, kiriman: 1, hargaSatuan: 8000, hargaJual: 10000 },
  { tanggal: "07-08-2025", kode: "8 pa", nama: "HIDAYATUL MUSTAFID", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 102, kiriman: 1, hargaSatuan: 5000, hargaJual: 10000 },
  { tanggal: "08-08-2025", kode: "8 pa", nama: "BAHASA ARAB 3", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 102, kiriman: 1, hargaSatuan: 9000, hargaJual: 10000 },
  { tanggal: "09-08-2025", kode: "8 pa", nama: "AKHLAQ LIL BANAT 2", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 102, kiriman: 1, hargaSatuan: 7000, hargaJual: 10000 },
  { tanggal: "10-08-2025", kode: "8 pa", nama: "MABADI' FIQHIYAH 3", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 102, kiriman: 1, hargaSatuan: 7000, hargaJual: 10000 },
  { tanggal: "11-08-2025", kode: "8 pa", nama: "KHORIDATUL BAHIYAH", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 103, kiriman: 1, hargaSatuan: 6000, hargaJual: 10000 },
  { tanggal: "12-08-2025", kode: "8 pa", nama: "MATNUR AJRUMIYAH", supplier: "PT SALEH SALIM", gudang: "PA", pesan: 1000, datang: 103, kiriman: 1, hargaSatuan: 5000, hargaJual: 10000 }
];

// Inisialisasi data dengan riwayat kiriman & tanggal ISO
let dataBarang = rawData.map((item, idx) => {
  const isoDate = reverseDateFormat(item.tanggal);
  const kirimanHistory = [{ kirimanKe: 1, jumlah: item.datang, tanggal: isoDate }];
  const pesananHistory = [{ jumlah: item.pesan, tanggal: isoDate }];
  const { pesan, ...rest } = item; // Hapus 'pesan' asli, sekarang dikelola oleh pesananHistory
  return { ...rest, tanggal: isoDate, kirimanHistory, pesananHistory, _idx: idx };
});

// Daftar master untuk semua nama gudang
let gudangList = [];

// ================================================================
//  FUNGSI BANTU
// ================================================================
function splitKode(kodeStr) {
  if (!kodeStr) return [];
  return kodeStr.split(',').map(s => s.trim()).filter(s => s !== '');
}

function getAllUniqueKodes(data) {
  const set = new Set();
  data.forEach(item => splitKode(item.kode).forEach(k => set.add(k)));
  return Array.from(set).sort();
}

function getTotalPesan(item) {
  if (!item.pesananHistory) return 0;
  return item.pesananHistory.reduce((sum, order) => sum + order.jumlah, 0);
}

function renderAll() {
  renderHomePage();
  renderDataBarang();
  renderBarangMasuk();
  renderGudang();
  renderGudangItemTable();
  // Halaman keuangan dirender saat tab diklik, jadi tidak perlu di sini.
  // Halaman barang keluar juga dirender saat diklik.
}

// Total pendapatan: jumlah nominal (hargaJual × qty) dari semua barang keluar
function updateTotalPendapatanKeluar() {
  const totalEl = document.getElementById('totalPendapatanKeluar');
  if (!totalEl) return;

  const total = (typeof dataBarangKeluar !== 'undefined' ? dataBarangKeluar : []).reduce((sum, record) => {
    const item = dataBarang.find(i => i._idx === record.barangIdx);
    const hargaJual = item ? item.hargaJual : 0;
    return sum + (hargaJual * record.jumlah);
  }, 0);

  totalEl.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

// ================================================================
//  EXPORT CSV
// ================================================================
function escapeCsvCell(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function exportTableToCsv(filename, headers, rows) {
  const lines = [headers.map(escapeCsvCell).join(',')];
  rows.forEach(row => {
    lines.push(row.map(escapeCsvCell).join(','));
  });
  const csv = '\uFEFF' + lines.join('\r\n'); // BOM agar Excel kenal UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

