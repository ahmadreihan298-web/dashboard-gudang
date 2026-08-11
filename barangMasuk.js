// ================================================================
//  BARANG MASUK (dengan filter status & tampilan lunas)
// ================================================================
const tabelMasuk = document.getElementById('tabelMasuk');
const totalAktif = document.getElementById('totalAktif');
const totalKurang = document.getElementById('totalKurang');
const infoMasuk = document.getElementById('infoMasuk');
const filterStatus = document.getElementById('filterStatus');
const jumlahStatus = document.getElementById('jumlahStatus');

function renderBarangMasuk() {
  const statusFilter = filterStatus.value; // 'semua', 'belum', 'lunas'

  // Ambil semua barang (bukan hanya aktif)
  let semua = dataBarang.map((item, idx) => ({ ...item, _idx: idx }));

  // Filter berdasarkan status
  let filtered = semua;
  if (statusFilter === 'belum') {
    filtered = semua.filter(item => getTotalPesan(item) > item.datang);
  } else if (statusFilter === 'lunas') {
    filtered = semua.filter(item => getTotalPesan(item) === item.datang);
  }

  // Hitung statistik (hanya untuk yang belum lunas)
  const belumLunas = dataBarang.filter(item => getTotalPesan(item) > item.datang);
  const totalKurangValue = belumLunas.reduce((sum, item) => sum + (getTotalPesan(item) - item.datang), 0);

   if (filtered.length === 0) {
    tabelMasuk.innerHTML = `<tr><td colspan="15" class="empty-table">Tidak ada data dengan filter ini</td></tr>`;
    jumlahStatus.textContent = '0 item';
  } else {
    let html = '';
    filtered.forEach((item, index) => {
      const totalPesan = getTotalPesan(item);
      const kurang = totalPesan - item.datang;
      const isLunas = kurang === 0;
      const rowClass = isLunas ? 'row-lunas' : '';
      const kurangHtml = `<span class="${isLunas ? 'text-lunas' : 'text-kurang'}">${kurang.toLocaleString('id-ID')}</span>`;

      const historyHtml = item.kirimanHistory.map(h => `<span>K${h.kirimanKe} (${reverseDateFormat(h.tanggal)}): ${h.jumlah.toLocaleString('id-ID')}</span>`).join('');
      const nextKiriman = item.kiriman + 1;
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

      html += `<tr class="${rowClass}">
        <td>${index + 1}</td>
        <td>${splitKode(item.kode).map(k => `<span class="badge">${k}</span>`).join(' ')}</td>
        <td>${item.nama}</td>
        <td>${item.supplier}</td>
        <td class="text-right">${totalPesan.toLocaleString('id-ID')}</td>
        <td class="text-right">${item.datang.toLocaleString('id-ID')}</td>
        <td><span class="badge-kirim">${historyHtml ? historyHtml : '<span>Belum ada</span>'}</span></td>
        <td class="text-right">${kurangHtml}</td>
        <td>${isLunas ? '<span class="status-lunas"><i data-feather="check-circle"></i> Lunas</span>' : '<span class="status-proses"><i data-feather="loader"></i> Proses</span>'}</td>
        <td>
          <input type="number" class="input-kirim" value="${nextKiriman}" min="${nextKiriman}" ${isLunas ? 'disabled' : ''} />
        </td>
        <td>
          <input type="date" class="input-date" value="${today}" ${isLunas ? 'disabled' : ''} style="width: 120px;" />
        </td>
        <td>
          <input type="number" class="input-qty" min="1" max="${isLunas ? 0 : kurang}" value="${isLunas ? 0 : 1}" ${isLunas ? 'disabled' : ''} />
        </td>
        <td>
           <button class="btn-undo" data-idx="${item._idx}" ${isLunas || item.kirimanHistory.length <= 1 ? 'disabled' : ''}>↩ Undo</button>
           <button class="btn-proses" ${isLunas ? 'disabled' : ''} data-idx="${item._idx}" data-max="${kurang}">Proses</button>
         </td>
         <td style="text-align: center;">
           <button class="btn-edit-history" data-idx="${item._idx}" ${item.kirimanHistory.length <= 1 ? 'disabled' : ''}><i data-feather="edit-2"></i></button>
         </td>
      </tr>`;
    });
    tabelMasuk.innerHTML = html;
    jumlahStatus.textContent = `${filtered.length} item`;
  }

  // Update statistik
  totalAktif.textContent = belumLunas.length;
  totalKurang.textContent = totalKurangValue.toLocaleString('id-ID');
  infoMasuk.textContent = `Menampilkan ${filtered.length} item (${statusFilter === 'semua' ? 'Semua' : statusFilter === 'belum' ? 'Belum Lunas' : 'Lunas'})`;
  feather.replace(); // Render new icons
}

// Event filter status
filterStatus.addEventListener('change', function () {
  renderBarangMasuk();
});

document.getElementById('refreshBtn').addEventListener('click', function () {
  renderBarangMasuk();
});

// Navigasi geser tabel Barang Masuk (panah kiri/kanan)
(function setupTableScroll() {
  const wrapper = document.getElementById('tableWrapperMasuk');
  const btnLeft = document.getElementById('scrollMasukLeft');
  const btnRight = document.getElementById('scrollMasukRight');
  if (!wrapper || !btnLeft || !btnRight) return;

  const scrollByAmount = () => wrapper.clientWidth * 0.8;

  function updateNavState() {
    const maxLeft = wrapper.scrollWidth - wrapper.clientWidth;
    btnLeft.disabled = wrapper.scrollLeft <= 1;
    btnRight.disabled = wrapper.scrollLeft >= maxLeft - 1;
  }

  btnLeft.addEventListener('click', () => {
    wrapper.scrollBy({ left: -scrollByAmount(), behavior: 'smooth' });
  });

  btnRight.addEventListener('click', () => {
    wrapper.scrollBy({ left: scrollByAmount(), behavior: 'smooth' });
  });

  wrapper.addEventListener('scroll', updateNavState);
  window.addEventListener('resize', updateNavState);
  updateNavState();
})();

// Event Delegation untuk tabel Barang Masuk
tabelMasuk.addEventListener('click', function (event) {
  const button = event.target;

  // Handle "Proses" button click
  if (button.classList.contains('btn-proses') && !button.disabled) {
    const row = button.closest('tr');
    const idx = parseInt(button.dataset.idx);
    const target = dataBarang[idx];

    const inputKirim = row.querySelector('.input-kirim');
    const inputDate = row.querySelector('.input-date');
    const inputQty = row.querySelector('.input-qty');
    const kirimanKe = parseInt(inputKirim.value) || 0;
    const shipmentDate = inputDate.value;
    const qty = parseInt(inputQty.value) || 0;
    const max = parseInt(button.dataset.max);

    if (kirimanKe <= 0) { return alert('Kiriman ke– harus diisi (minimal 1)'); }
    if (!shipmentDate) { return alert('Tanggal kiriman harus diisi.'); }
    if (kirimanKe <= target.kiriman) { return alert(`Kiriman ke–${kirimanKe} sudah pernah diproses. Kiriman terakhir adalah ${target.kiriman}. Gunakan Undo jika ingin membatalkan.`); }
    if (qty <= 0) { return alert('Masukkan jumlah yang valid (minimal 1)'); }
    if (qty > max) { return alert(`Jumlah tidak boleh melebihi kekurangan (${max})`); }

    target.datang += qty;
    target.kiriman = kirimanKe;
    target.kirimanHistory.push({ kirimanKe: kirimanKe, jumlah: qty, tanggal: shipmentDate });

    renderAll();
    saveAllData();
  }

  // Handle "Undo" button click
  if (button.classList.contains('btn-undo') && !button.disabled) {
    const idx = parseInt(button.dataset.idx);
    const target = dataBarang[idx];

    if (target.kirimanHistory.length <= 1) {
      return alert('Tidak ada kiriman yang bisa dibatalkan.');
    }

    const last = target.kirimanHistory.pop();
    target.datang -= last.jumlah;
    const prev = target.kirimanHistory[target.kirimanHistory.length - 1];
    target.kiriman = prev ? prev.kirimanKe : 0;

    renderAll();
    saveAllData();
  }
});

// ================================================================
//  EDIT RIWAYAT KIRIMAN
// ================================================================
let historiEditList = [];
let historiEditItemIdx = null;

tabelMasuk.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-edit-history');
  if (!btn) return;
  const idx = parseInt(btn.getAttribute('data-idx'));
  const item = dataBarang[idx];
  if (!item || !item.kirimanHistory.length) return;

  historiEditItemIdx = idx;
  historiEditList = [...item.kirimanHistory];
  renderEditHistoryList();
  document.getElementById('editHistoryTitle').textContent = `Edit ${item.nama}`;
  document.getElementById('editHistoryItemName').textContent = item.nama;
  document.getElementById('editHistoryModal').classList.add('is-visible');
});

function renderEditHistoryList() {
  const container = document.getElementById('editHistoryList');
  if (!container) return;

  let html = '';
  historiEditList.forEach((h, i) => {
    const isFirst = i === 0;
    html += `<div style="display:flex; gap:8px; align-items:end; margin-bottom:12px;">
      <div style="flex:1;">
        <label style="font-size:11px; color:var(--text-muted);">Kiriman Ke-</label>
        <input type="number" min="${isFirst ? 1 : historiEditList[i-1].kirimanKe + 1}" 
               value="${h.kirimanKe}" 
               style="width:100%; height:36px;"
               data-edit-kiriman="${i}">
      </div>
      <div style="flex:1;">
        <label style="font-size:11px; color:var(--text-muted);">Jumlah</label>
        <input type="number" min="0" value="${h.jumlah}" 
               style="width:100%; height:36px;"
               data-edit-jumlah="${i}">
      </div>
      <div style="flex:1;">
        <label style="font-size:11px; color:var(--text-muted);">Tanggal</label>
        <input type="date" value="${h.tanggal}" 
               style="width:100%; height:36px;"
               data-edit-tanggal="${i}">
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

document.getElementById('cancelEditHistoryBtn').addEventListener('click', function() {
  document.getElementById('editHistoryModal').classList.remove('is-visible');
  historiEditList = [];
  historiEditItemIdx = null;
});

document.getElementById('saveEditHistoryBtn').addEventListener('click', function() {
  const modal = document.getElementById('editHistoryModal');
  const kirimanInputs = modal.querySelectorAll('[data-edit-kiriman]');
  const jumlahInputs = modal.querySelectorAll('[data-edit-jumlah]');
  const tanggalInputs = modal.querySelectorAll('[data-edit-tanggal]');

  for (let i = 0; i < historiEditList.length; i++) {
    const kirimanVal = parseInt(kirimanInputs[i].value);
    const jumlahVal = parseInt(jumlahInputs[i].value);
    const tanggalVal = tanggalInputs[i].value;

    if (kirimanVal > 0) historiEditList[i].kirimanKe = kirimanVal;
    if (!isNaN(jumlahVal)) historiEditList[i].jumlah = jumlahVal;
    if (tanggalVal) historiEditList[i].tanggal = tanggalVal;
  }

  historiEditList.sort((a, b) => a.kirimanKe - b.kirimanKe);

  const item = dataBarang[historiEditItemIdx];
  if (item) {
    item.kirimanHistory = [...historiEditList];
    item.datang = historiEditList.reduce((sum, h) => sum + h.jumlah, 0);
    item.kiriman = historiEditList[historiEditList.length - 1]?.kirimanKe || 0;
  }

  modal.classList.remove('is-visible');
  historiEditList = [];
  historiEditItemIdx = null;
  saveAllData();
  renderAll();
});

document.getElementById('editHistoryModal').addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('is-visible');
    historiEditList = [];
    historiEditItemIdx = null;
  }
});

tabelMasuk.addEventListener('change', function (event) {
  const input = event.target;
  if (input.classList.contains('input-qty') && !input.disabled) {
    const row = input.closest('tr');
    const btn = row.querySelector('.btn-proses');
    if (!btn) return;

    const max = parseInt(btn.dataset.max);
    input.setAttribute('max', max); // Pastikan atribut max selalu ada

    let val = parseInt(input.value);
    if (isNaN(val) || val < 1) {
      val = 1;
    }
    if (val > max) {
      val = max;
    }
    input.value = val;
  }
});

// Event Delegation for Enter key to process shipment
tabelMasuk.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    const input = event.target;
    // Check if the event came from one of our inputs
    if (input.classList.contains('input-kirim') || input.classList.contains('input-date') || input.classList.contains('input-qty')) {
      event.preventDefault(); // Prevent default behavior
      const row = input.closest('tr');
      const prosesBtn = row.querySelector('.btn-proses');
      if (prosesBtn && !prosesBtn.disabled) {
        prosesBtn.click();
      }
    }
  }
});

// ================================================================
//  UPLOAD CSV
// ================================================================
const csvFileInput = document.getElementById('csvFileInput');
const uploadCsvBtn = document.getElementById('uploadCsvBtn');
const csvFileNameSpan = document.getElementById('csvFileName');

// Event listener for file input change
csvFileInput.addEventListener('change', function () {
  if (this.files && this.files[0]) {
    csvFileNameSpan.textContent = this.files[0].name;
    uploadCsvBtn.disabled = false;
  } else {
    csvFileNameSpan.textContent = 'Tidak ada file dipilih';
    uploadCsvBtn.disabled = true;
  }
});

// Event listener for upload button click
uploadCsvBtn.addEventListener('click', function () {
  if (csvFileInput.files && csvFileInput.files[0]) {
    const file = csvFileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const csvContent = e.target.result;
        parseAndUploadCsv(csvContent);
        alert('Data CSV berhasil diunggah dan ditambahkan.');
        csvFileInput.value = ''; // Clear file input
        csvFileNameSpan.textContent = 'Tidak ada file dipilih';
        uploadCsvBtn.disabled = true;
      } catch (error) {
        console.error('Error processing CSV:', error);
        alert('Gagal memproses file CSV. Pastikan formatnya benar. Error: ' + error.message);
      }
    };

    reader.onerror = function () {
      alert('Gagal membaca file.');
    };

    reader.readAsText(file);
  } else {
    alert('Pilih file CSV terlebih dahulu.');
  }
});

function parseAndUploadCsv(csvString) {
  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length <= 1) {
    throw new Error('File CSV kosong atau hanya berisi header.');
  }

  // Hapus BOM (Byte Order Mark) jika ada di awal file
  if (lines[0].charCodeAt(0) === 0xFEFF) {
    lines[0] = lines[0].substring(1);
  }

  // 1. Normalize headers from CSV file (case-insensitive)
  const fileHeaders = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());

  // 2. Define expected data structure and possible header aliases
  const headerMapping = {
    tanggal: ['tanggal'],
    kode: ['kode'],
    nama: ['nama'],
    supplier: ['supplier', 'asal'], // 'asal' is an alias for 'supplier'
    gudang: ['gudang'],
    pesan: ['pesan'],
    datang: ['datang'],
    kiriman: ['kiriman'],
    hargaSatuan: ['hargasatuan', 'harga satuan'], // 'harga satuan' is an alias
    hargaJual: ['hargajual', 'harga jual']
  };

  // 3. Find the index for each required field
  const columnIndex = {};
  const missingHeaders = [];

  for (const key in headerMapping) {
    const aliases = headerMapping[key];
    let foundIndex = -1;
    for (const alias of aliases) {
      const index = fileHeaders.indexOf(alias);
      if (index !== -1) {
        foundIndex = index;
        break;
      }
    }
    if (foundIndex !== -1) {
      columnIndex[key] = foundIndex;
    } else {
      missingHeaders.push(key); // This is a required field
    }
  }

  if (missingHeaders.length > 0) {
    throw new Error(`Header CSV tidak lengkap. Header yang dibutuhkan (atau aliasnya) hilang: ${missingHeaders.join(', ')}.`);
  }

  // 4. Process each data row
  const newItems = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < Object.keys(columnIndex).length) {
      console.warn(`Baris ${i + 1} dilewati karena jumlah kolom tidak cocok.`);
      continue;
    }

    const isoDate = reverseDateFormat(values[columnIndex.tanggal]);
    const pesan = parseInt(values[columnIndex.pesan]) || 0;
    const datang = parseInt(values[columnIndex.datang]) || 0;
    const kiriman = parseInt(values[columnIndex.kiriman]) || 0;
    const hargaSatuan = parseCurrency(values[columnIndex.hargaSatuan]);
    const hargaJual = parseCurrency(values[columnIndex.hargaJual]);

    newItems.push({
      tanggal: isoDate, kode: values[columnIndex.kode], nama: values[columnIndex.nama], supplier: values[columnIndex.supplier], gudang: values[columnIndex.gudang],
      datang: datang, kiriman: kiriman, hargaSatuan: hargaSatuan, hargaJual: hargaJual, // Use parsed values
      kirimanHistory: [{ kirimanKe: kiriman, jumlah: datang, tanggal: isoDate }],
      pesananHistory: [{ jumlah: pesan, tanggal: isoDate }],
    });
  }

  let currentMaxIdx = dataBarang.length > 0 ? Math.max(...dataBarang.map(item => item._idx)) : -1;
  newItems.forEach((item, index) => {
    item._idx = currentMaxIdx + 1 + index;
  });

  dataBarang = dataBarang.concat(newItems);

  populateFilter();
  renderAll();
  saveAllData();
}

function exportBarangMasukCsv() {
  const headers = ['#', 'Kode', 'Nama', 'Supplier', 'Pesan', 'Sudah Datang', 'Kekurangan', 'Status', 'Kiriman Ke-'];
  const rows = dataBarang.map((item, index) => {
    const totalPesan = getTotalPesan(item);
    const kurang = totalPesan - item.datang;
    return [
      index + 1,
      item.kode,
      item.nama,
      item.supplier,
      totalPesan,
      item.datang,
      kurang,
      kurang === 0 ? 'Lunas' : 'Proses',
      item.kiriman
    ];
  });
  exportTableToCsv('barang_masuk.csv', headers, rows);
}

