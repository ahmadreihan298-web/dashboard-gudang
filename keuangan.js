// ================================================================
//  KEUANGAN
// ================================================================
// Data storage for financial transactions
let dataKeuangan = [];
let nextKeuanganId = 1;

// Data storage for Kirim ke Putri
let kirimPutriHistory = [];
let nextKpId = 1;

const financePage = document.getElementById('page-keuangan');
const formPemasukan = document.getElementById('formPemasukan');
const tabelRiwayatPemasukan = document.getElementById('tabelRiwayatPemasukan');
const pemasukanJumlahInput = document.getElementById('pemasukanJumlah');
const formPengeluaran = document.getElementById('formPengeluaran');
const tabelRiwayatPengeluaran = document.getElementById('tabelRiwayatPengeluaran');
const pengeluaranJumlahInput = document.getElementById('pengeluaranJumlah');

// Auto-format currency input for Pemasukan
if (pemasukanJumlahInput) {
  pemasukanJumlahInput.addEventListener('input', (e) => {
    // Remove all non-digit characters to get the raw number
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      // Format the number with Indonesian locale for dot separators
      e.target.value = parseInt(value, 10).toLocaleString('id-ID');
    } else {
      e.target.value = '';
    }
  });
}

// Auto-format currency input for Pengeluaran
if (pengeluaranJumlahInput) {
  pengeluaranJumlahInput.addEventListener('input', (e) => {
    // Remove all non-digit characters to get the raw number
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      // Format the number with Indonesian locale for dot separators
      e.target.value = parseInt(value, 10).toLocaleString('id-ID');
    } else {
      e.target.value = '';
    }
  });
}

// Function to format number as currency
function formatCurrency(number) {
  return `Rp ${number.toLocaleString('id-ID')}`;
}

// Function to render the income history table
function renderRiwayatPemasukan() {
  if (!tabelRiwayatPemasukan) return;

  const pemasukanData = dataKeuangan
    .filter(trx => trx.type === 'pemasukan')
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Sort by most recent

  const totalPemasukan = pemasukanData.reduce((sum, trx) => sum + trx.jumlah, 0);

  if (pemasukanData.length === 0) {
    tabelRiwayatPemasukan.innerHTML = `<tr><td colspan="5" class="empty-table">Belum ada riwayat pemasukan.</td></tr>`;
  } else {
    let html = '';
    pemasukanData.forEach((trx, index) => {
      html += `
        <tr data-id="${trx.id}">
          <td style="text-align: center;">${index + 1}</td>
          <td>${reverseDateFormat(trx.tanggal)}</td>
          <td>${trx.keterangan}</td>
          <td class="text-right" style="color: #16a34a; font-weight: 600;">${formatCurrency(trx.jumlah)}</td>
          <td style="text-align: center;">
            <button class="btn-undo" title="Hapus Transaksi" style="background-color: #ef4444;" onclick="hapusTransaksi(${trx.id})"><i data-feather="trash-2"></i></button>
          </td>
        </tr>
      `;
    });
    tabelRiwayatPemasukan.innerHTML = html;
    feather.replace();
  }

  // Update the total in the tfoot
  const totalPemasukanEl = document.getElementById('totalPemasukan');
  if (totalPemasukanEl) {
    totalPemasukanEl.textContent = formatCurrency(totalPemasukan);
  }
}

// Function to render the expense history table
function renderRiwayatPengeluaran() {
  if (!tabelRiwayatPengeluaran) return;

  const pengeluaranData = dataKeuangan
    .filter(trx => trx.type === 'pengeluaran')
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Sort by most recent

  const totalPengeluaran = pengeluaranData.reduce((sum, trx) => sum + trx.jumlah, 0);

  if (pengeluaranData.length === 0) {
    tabelRiwayatPengeluaran.innerHTML = `<tr><td colspan="5" class="empty-table">Belum ada riwayat pengeluaran.</td></tr>`;
  } else {
    let html = '';
    pengeluaranData.forEach((trx, index) => {
      html += `
        <tr data-id="${trx.id}">
          <td style="text-align: center;">${index + 1}</td>
          <td>${reverseDateFormat(trx.tanggal)}</td>
          <td>${trx.keterangan}</td>
          <td class="text-right" style="color: #ef4444; font-weight: 600;">${formatCurrency(trx.jumlah)}</td>
          <td style="text-align: center;">
            <button class="btn-undo" title="Hapus Transaksi" style="background-color: #ef4444;" onclick="hapusTransaksi(${trx.id})"><i data-feather="trash-2"></i></button>
          </td>
        </tr>
      `;
    });
    tabelRiwayatPengeluaran.innerHTML = html;
    feather.replace();
  }

  // Update the total in the tfoot
  const totalPengeluaranEl = document.getElementById('totalPengeluaran');
  if (totalPengeluaranEl) {
    totalPengeluaranEl.textContent = formatCurrency(totalPengeluaran);
  }
}

// Function to delete a transaction
function hapusTransaksi(id) {
  if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
    const trxToDelete = dataKeuangan.find(trx => trx.id === id);
    if (!trxToDelete) return;

    dataKeuangan = dataKeuangan.filter(trx => trx.id !== id);

    // Refresh the correct table based on the type of transaction deleted
    if (trxToDelete.type === 'pemasukan') {
      renderRiwayatPemasukan();
    } else {
      renderRiwayatPengeluaran();
    }
    saveAllData();
  }
}

// Handle form submission for Pemasukan (Income)
if (formPemasukan) {
  document.getElementById('pemasukanTanggal').value = new Date().toISOString().split('T')[0];

  formPemasukan.addEventListener('submit', (e) => {
    e.preventDefault();
    const tanggal = document.getElementById('pemasukanTanggal').value;
    const keterangan = document.getElementById('pemasukanKeterangan').value.trim();
    // Remove dots before parsing to integer
    const jumlah = parseInt(document.getElementById('pemasukanJumlah').value.replace(/\./g, ''), 10);

    if (!tanggal || !keterangan || isNaN(jumlah) || jumlah <= 0) {
      return alert('Harap isi semua kolom dengan benar. Jumlah harus lebih dari 0.');
    }

    dataKeuangan.push({ id: nextKeuanganId++, type: 'pemasukan', tanggal, keterangan, jumlah });
    alert('Pemasukan berhasil dicatat.');
    formPemasukan.reset();
    document.getElementById('pemasukanTanggal').value = new Date().toISOString().split('T')[0];
    renderRiwayatPemasukan();
    saveAllData();
  });
}

// Handle form submission for Pengeluaran (Expense)
if (formPengeluaran) {
  document.getElementById('pengeluaranTanggal').value = new Date().toISOString().split('T')[0];

  formPengeluaran.addEventListener('submit', (e) => {
    e.preventDefault();
    const tanggal = document.getElementById('pengeluaranTanggal').value;
    const keterangan = document.getElementById('pengeluaranKeterangan').value.trim();
    // Remove dots before parsing to integer
    const jumlah = parseInt(document.getElementById('pengeluaranJumlah').value.replace(/\./g, ''), 10);

    if (!tanggal || !keterangan || isNaN(jumlah) || jumlah <= 0) {
      return alert('Harap isi semua kolom dengan benar. Jumlah harus lebih dari 0.');
    }

    dataKeuangan.push({ id: nextKeuanganId++, type: 'pengeluaran', tanggal, keterangan, jumlah });
    alert('Pengeluaran berhasil dicatat.');
    formPengeluaran.reset();
    document.getElementById('pengeluaranTanggal').value = new Date().toISOString().split('T')[0];
    renderRiwayatPengeluaran();
    saveAllData();
  });
}

// Keuangan kini ditampilkan berdampingan (dua kolom), tanpa tab.
// Kedua riwayat dirender sekaligus saat halaman dibuka.
if (financePage) {
  renderRiwayatPemasukan();
  renderRiwayatPengeluaran();
}

function exportPemasukanCsv() {
  const headers = ['#', 'Tanggal', 'Keterangan', 'Jumlah'];
  const rows = dataKeuangan
    .filter(trx => trx.type === 'pemasukan')
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .map((trx, index) => [
      index + 1,
      reverseDateFormat(trx.tanggal),
      trx.keterangan,
      trx.jumlah
    ]);
  exportTableToCsv('riwayat_pemasukan.csv', headers, rows);
}

function exportPengeluaranCsv() {
  const headers = ['#', 'Tanggal', 'Keterangan', 'Jumlah'];
  const rows = dataKeuangan
    .filter(trx => trx.type === 'pengeluaran')
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .map((trx, index) => [
      index + 1,
      reverseDateFormat(trx.tanggal),
      trx.keterangan,
      trx.jumlah
    ]);
  exportTableToCsv('riwayat_pengeluaran.csv', headers, rows);
}

