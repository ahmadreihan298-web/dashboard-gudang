// ================================================================
//  BARANG KELUAR
// ================================================================
let dataBarangKeluar = [];
let nextBarangKeluarId = 1;
const barangKeluarCodeTabsContainer = document.getElementById('barangKeluarCodeTabs');
const barangKeluarTabContentContainer = document.getElementById('barangKeluarTabContent');
const tabelRiwayatBarangKeluar = document.getElementById('tabelRiwayatBarangKeluar');
const formBarangKeluar = document.getElementById('formBarangKeluar');
const searchBarangKeluar = document.getElementById('searchBarangKeluar');

if (searchBarangKeluar) {
  searchBarangKeluar.addEventListener('input', function () {
    const term = this.value.toLowerCase().trim();
    const panels = document.querySelectorAll('#barangKeluarTabContent .item-tab-panel');

    let firstPanelSuffix = null;
    let firstSubNum = null;

    panels.forEach(panel => {
      const subPanels = panel.querySelectorAll('.item-sub-panel');

      subPanels.forEach(subPanel => {
        const cards = subPanel.querySelectorAll('.item-card-keluar');
        let visibleCount = 0;

        cards.forEach(card => {
          const itemName = (card.dataset.itemName || '').toLowerCase();
          const matches = !term || itemName.includes(term);
          card.style.display = matches ? '' : 'none';
          if (matches) visibleCount++;

          if (!matches && card.classList.contains('selected')) {
            card.classList.remove('selected');
            const qtyInput = card.querySelector('.item-qty-input');
            if (qtyInput) qtyInput.disabled = true;
          }
        });

        let noResults = subPanel.querySelector('.no-search-results');
        if (visibleCount === 0 && term) {
          if (!noResults) {
            noResults = document.createElement('div');
            noResults.className = 'no-search-results';
            noResults.style.cssText = 'text-align: center; padding: 20px; color: var(--text-muted); font-style: italic;';
            noResults.textContent = 'Tidak ada barang yang cocok';
            subPanel.appendChild(noResults);
          }
        } else if (noResults) {
          noResults.remove();
        }

        updateSetAllQtyControls(subPanel);

        if (visibleCount > 0 && !firstPanelSuffix) {
          firstPanelSuffix = panel.dataset.kodeContent;
          firstSubNum = subPanel.dataset.subContent;
        }
      });
    });

    if (term && firstPanelSuffix) {
      const targetButton = document.querySelector(`#barangKeluarCodeTabs .item-code-tab-btn[data-kode="${firstPanelSuffix}"]`);
      if (targetButton && !targetButton.classList.contains('active')) {
        targetButton.click();
      }

      const targetSubBtn = document.querySelector(`#barangKeluarTabContent .item-tab-panel[data-kode-content="${firstPanelSuffix}"] .item-sub-tab-btn[data-sub="${firstSubNum}"]`);
      if (targetSubBtn && !targetSubBtn.classList.contains('active')) {
        targetSubBtn.click();
      }
    }

    updateTotalHargaBarangKeluar();
  });

  searchBarangKeluar.addEventListener('search', function () {
    if (!this.value) {
      const noResults = document.querySelectorAll('.no-search-results');
      noResults.forEach(el => el.remove());
    }
  });
}

if (barangKeluarCodeTabsContainer) {
  barangKeluarCodeTabsContainer.addEventListener('click', (e) => {
    const tabButton = e.target.closest('.item-code-tab-btn');
    if (!tabButton) return;

    const kode = tabButton.dataset.kode;

    barangKeluarCodeTabsContainer.querySelectorAll('.item-code-tab-btn').forEach(btn => btn.classList.remove('active'));
    barangKeluarTabContentContainer.querySelectorAll('.item-tab-panel').forEach(panel => panel.classList.remove('active'));

    tabButton.classList.add('active');
    const panelToActivate = barangKeluarTabContentContainer.querySelector(`.item-tab-panel[data-kode-content="${kode}"]`);
    if (panelToActivate) {
      panelToActivate.classList.add('active');

      // Aktifkan sub-tab pertama di panel
      const firstSubBtn = panelToActivate.querySelector('.item-sub-tab-btn');
      if (firstSubBtn && !firstSubBtn.classList.contains('active')) {
        firstSubBtn.click();
      }
    }
  });
}

if (barangKeluarTabContentContainer) {
  barangKeluarTabContentContainer.addEventListener('click', (e) => {
    // Handle klik sub-tab (angka: 1, 2, 3, ...)
    const subTabBtn = e.target.closest('.item-sub-tab-btn');
    if (subTabBtn) {
      const panel = subTabBtn.closest('.item-tab-panel');
      const subNum = subTabBtn.dataset.sub;

      panel.querySelectorAll('.item-sub-tab-btn').forEach(btn => btn.classList.remove('active'));
      panel.querySelectorAll('.item-sub-panel').forEach(sp => sp.classList.remove('active'));

      subTabBtn.classList.add('active');
      const subPanel = panel.querySelector(`.item-sub-panel[data-sub-content="${subNum}"]`);
      if (subPanel) subPanel.classList.add('active');
      return;
    }

    if (e.target.tagName === 'INPUT') {
      return;
    }

    const card = e.target.closest('.item-card-keluar');
    if (card) {
      const isSelected = card.classList.toggle('selected');
      const qtyInput = card.querySelector('.item-qty-input');
      if (qtyInput) {
        qtyInput.disabled = !isSelected;
      }

      const subPanel = card.closest('.item-sub-panel');
      updateSetAllQtyControls(subPanel);
      updateTotalHargaBarangKeluar();
    }
  });

  barangKeluarTabContentContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('select-all-checkbox')) {
      const subPanel = e.target.closest('.item-sub-panel');
      if (subPanel) {
        const isChecked = e.target.checked;
        subPanel.querySelectorAll('.item-card-keluar').forEach(card => {
          const isCurrentlySelected = card.classList.contains('selected');
          if (isCurrentlySelected !== isChecked) {
            card.classList.toggle('selected', isChecked);
            const qtyInput = card.querySelector('.item-qty-input');
            if (qtyInput) {
              qtyInput.disabled = !isChecked;
            }
          }
        });
        updateSetAllQtyControls(subPanel);
        updateTotalHargaBarangKeluar();
      }
    }
    if (e.target.classList.contains('item-qty-input')) {
      updateTotalHargaBarangKeluar();
    }
  });

  barangKeluarTabContentContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('item-qty-input')) {
      updateTotalHargaBarangKeluar();
    }
    if (e.target.classList.contains('set-all-qty-input')) {
      const subPanel = e.target.closest('.item-sub-panel');
      if (!subPanel) return;

      const masterQtyValue = e.target.value;
      const masterQty = parseInt(masterQtyValue, 10);

      if (!masterQtyValue || isNaN(masterQty) || masterQty <= 0) {
        return;
      }

      const selectedCards = subPanel.querySelectorAll('.item-card-keluar.selected');
      selectedCards.forEach(card => {
        const qtyInput = card.querySelector('.item-qty-input');
        if (qtyInput) {
          const maxStock = parseInt(qtyInput.max, 10);
          qtyInput.value = Math.min(masterQty, maxStock);
          qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      updateTotalHargaBarangKeluar();
    }
  });
}

/**
 * Menyuntikkan style CSS untuk kartu barang keluar agar memiliki garis yang jelas.
 * Ini memastikan tampilan kartu konsisten dan menonjol.
 */
function injectCardStyles() {
  const styleId = 'dynamic-card-styles';
  let styleSheet = document.getElementById(styleId);

  if (!styleSheet) {
    styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    document.head.appendChild(styleSheet);
  }

  styleSheet.innerText = `
        /* Kartu barang keluar ikut var(--...) asli dari style.css, gak override layout lagi */
        .item-card-keluar.selected {
            background-color: var(--primary-soft) !important;
        }

        /* Select All & Set Quantity — pakai token kaca yang beneran ada */
        .select-all-container {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
        }

        .select-all-label {
            cursor: pointer;
            align-items: center;
            justify-content: center;
            width: 46px;
            height: 46px;
            margin: 0;
            display: flex;
            padding: 0;
        }

        /* Sembunyikan checkbox asli, gambar ulang jadi kotak custom */
        .select-all-container .select-all-checkbox {
            appearance: none;
            -webkit-appearance: none;
            width: 46px;
            height: 46px;
            border: 2px solid var(--border-color);
            border-radius: 50%;
            background: var(--bg-surface);
            cursor: pointer;
            position: relative;
            transition: border-color 0.2s ease, background 0.2s ease;
            margin: 0;
            outline: none;
        }

        .select-all-container .select-all-checkbox:checked {
            background: var(--primary);
            border-color: var(--primary);
        }

        .select-all-container .select-all-checkbox:checked::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 18px;
            height: 9px;
            border-left: 3px solid white;
            border-bottom: 3px solid white;
            transform: translate(-50%, -70%) rotate(-45deg);
        }

        .set-all-qty-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0;
        }

        .item-tab-panel.active .item-card-container {
            margin-top: 16px;
        }

        .set-all-qty-input {
            width: 155px;
            height: 42px;
            padding: 10px 14px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-surface);
            color: var(--text-main);
            text-align: center;
            font-size: 15px;
            position: relative;
            top: -6px;
        }

        .set-all-qty-input::placeholder {
            color: var(--text-muted);
        }

        .set-all-qty-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: var(--focus-ring);
        }
    `;
}

// Hitung total harga dari semua kartu terpilih (hargaJual × jumlah)
function updateTotalHargaBarangKeluar() {
  const totalEl = document.getElementById('totalHargaBarangKeluar');
  if (!totalEl) return;

  const selectedCards = barangKeluarTabContentContainer.querySelectorAll('.item-card-keluar.selected');
  let total = 0;

  selectedCards.forEach(card => {
    const itemName = (card.dataset.itemName || '').trim();
    const qtyInput = card.querySelector('.item-qty-input');
    const requestedJumlah = parseInt(qtyInput ? qtyInput.value : 0, 10) || 0;
    if (!itemName || requestedJumlah <= 0) return;

    const relevantDataBarangItems = dataBarang
      .filter(item => (item.nama || '').trim() === itemName && parseFloat(item.datang) > 0)
      .sort((a, b) => parseFloat(b.datang) - parseFloat(a.datang));

    let remaining = requestedJumlah;
    for (const item of relevantDataBarangItems) {
      if (remaining <= 0) break;
      const deducted = Math.min(remaining, parseFloat(item.datang));
      const hargaJual = parseFloat(item.hargaJual) || 0;
      total += deducted * hargaJual;
      remaining -= deducted;
    }
  });

  totalEl.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

function updateSetAllQtyControls(panel) {
  if (!panel) return;
  const setAllQtyInput = panel.querySelector('.set-all-qty-input');
  const selectedCount = panel.querySelectorAll('.item-card-keluar.selected').length;

  if (setAllQtyInput) {
    const shouldBeEnabled = selectedCount > 0;
    setAllQtyInput.disabled = !shouldBeEnabled;
    if (!shouldBeEnabled) {
      setAllQtyInput.value = ''; // Clear value if no items are selected
    }
  }
}

function populateBarangKeluarForm(suffixFilter) {
  // Pastikan style untuk kartu dan checkbox "Select All" sudah ada di dalam <head>
  injectCardStyles();

  // Kosongkan dulu isi lama sebelum render ulang (biar tab & panel gak numpuk dobel)
  barangKeluarCodeTabsContainer.innerHTML = '';
  barangKeluarTabContentContainer.innerHTML = '';

  // Reset styles on the main content container
  barangKeluarTabContentContainer.removeAttribute('style');
  barangKeluarTabContentContainer.className = 'item-tab-content';

  const availableItems = dataBarang.filter(item => item.datang > 0);
  const uniqueKodes = getAllUniqueKodes(availableItems);

  if (availableItems.length === 0) {
    barangKeluarTabContentContainer.innerHTML = `
        <div class="empty-table" style="padding: 20px 0;">
            Tidak ada barang dengan stok.
        </div>
    `;
    return;
  }

  // 1. Group all available items by name
  const masterGroupedItems = availableItems.reduce((acc, item) => {
    const itemName = item.nama.trim();

    if (!acc[itemName]) {
      acc[itemName] = {
        nama: itemName,
        totalStok: 0,
        kodes: new Set(),
        originalItems: []
      };
    }

    acc[itemName].totalStok += item.datang;

    splitKode(item.kode).forEach(k => {
      acc[itemName].kodes.add(k);
    });

    acc[itemName].originalItems.push({
      _idx: item._idx,
      datang: item.datang,
      gudang: item.gudang
    });

    return acc;
  }, {});

  // 2. Kelompokkan kode: level 1 = suffix huruf (PA, PI), level 2 = angka (1, 2, 3...)
  //    Contoh: "1 pa" → suffix "PA", angka "1"
  const suffixGroups = new Map(); // suffix -> Map(num -> Set(kode))
  uniqueKodes.forEach(k => {
    const parts = k.trim().split(/\s+/);
    const num = parts[0] || '';
    const suffix = (parts[1] || '').toUpperCase();

    if (!suffixGroups.has(suffix)) suffixGroups.set(suffix, new Map());
    const numMap = suffixGroups.get(suffix);
    if (!numMap.has(num)) numMap.set(num, new Set());
    numMap.get(num).add(k);
  });

  // Sort suffix secara alfabetis, lalu angka secara numerik
  let suffixKeys = Array.from(suffixGroups.keys()).sort();

  // Jika ada filter suffix (mode HP per kode), batasi hanya suffix tersebut
  if (suffixFilter) {
    const norm = suffixFilter.toUpperCase();
    suffixKeys = suffixKeys.filter(s => s === norm);
  }

  // Iterate over each suffix (PA, PI, ...) to create main tab & panel
  suffixKeys.forEach((suffix, index) => {
    const numMap = suffixGroups.get(suffix);

    // Create Main Tab Button
    const tabButton = document.createElement('button');

    tabButton.type = 'button';
    tabButton.className = 'item-code-tab-btn';
    tabButton.dataset.kode = suffix;
    tabButton.textContent = suffix;

    if (index === 0) {
      tabButton.classList.add('active');
    }

    barangKeluarCodeTabsContainer.appendChild(tabButton);

    // Create Main Tab Panel
    const tabPanel = document.createElement('div');

    tabPanel.className = 'item-tab-panel';
    tabPanel.dataset.kodeContent = suffix;

    if (index === 0) {
      tabPanel.classList.add('active');
    }

    // Sub-tab bar (angka: 1, 2, 3, ...)
    const numKeys = Array.from(numMap.keys()).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });

    const subTabsContainer = document.createElement('div');
    subTabsContainer.className = 'item-sub-tabs';

    numKeys.forEach((num, numIdx) => {
      const subBtn = document.createElement('button');
      subBtn.type = 'button';
      subBtn.className = 'item-sub-tab-btn';
      subBtn.dataset.sub = num;
      subBtn.textContent = num;

      if (numIdx === 0) {
        subBtn.classList.add('active');
      }

      subTabsContainer.appendChild(subBtn);
    });

    tabPanel.appendChild(subTabsContainer);

    // Create sub-panels for each number
    numKeys.forEach((num, numIdx) => {
      const subPanel = document.createElement('div');
      subPanel.className = 'item-sub-panel';
      subPanel.dataset.subContent = num;

      if (numIdx === 0) {
        subPanel.classList.add('active');
      }

      // Select All + Set Qty per sub-panel
      const selectAllContainer = document.createElement('div');
      selectAllContainer.className = 'select-all-container';

      const selectAllId =
        `select-all-${suffix.replace(/[^a-zA-Z0-9]/g, '_')}_${num.replace(/[^a-zA-Z0-9]/g, '_')}`;

      selectAllContainer.innerHTML = `
          <label for="${selectAllId}" class="select-all-label" aria-label="Select All" title="Pilih Semua">
              <input
                  type="checkbox"
                  class="select-all-checkbox"
                  id="${selectAllId}"
              >
          </label>

          <div class="set-all-qty-wrapper">
              <input
                  type="number"
                  class="set-all-qty-input"
                  placeholder="Jumlah"
                  min="1"
                  disabled
              >
          </div>
      `;

      subPanel.appendChild(selectAllContainer);

      // Filter items yang kodenya ada di (suffix, num)
      const kodeSet = numMap.get(num);
      const cardsForThisGroup = Object.values(masterGroupedItems)
        .filter(cardData => {
          const cardKodes = Array.from(cardData.kodes);
          return cardKodes.some(k => kodeSet.has(k));
        })
        .sort((a, b) => a.nama.localeCompare(b.nama));

      let cardsHtml = '';

      if (cardsForThisGroup.length > 0) {
        cardsForThisGroup.forEach(groupedItem => {

          const sanitizedName =
            groupedItem.nama.replace(/[^a-zA-Z0-9]/g, '_');

          const uniqueIdSuffix =
            `${sanitizedName}_${suffix.replace(
              /[^a-zA-Z0-9]/g,
              '_'
            )}_${num.replace(/[^a-zA-Z0-9]/g, '_')}`;

          cardsHtml += `
                  <div
                      class="item-card-keluar"
                      data-item-name="${groupedItem.nama}"
                      tabindex="0"
                      title="${groupedItem.nama}"
                  >

                      <div class="item-card-keluar-header">

                          <h4 class="item-name">
                              ${groupedItem.nama}
                          </h4>

                          <input
                              type="number"
                              class="item-qty-input"
                              id="qty-input-${uniqueIdSuffix}"
                              min="1"
                              max="${groupedItem.totalStok}"
                              value="1"
                              disabled
                              placeholder="Jumlah"
                          >

                      </div>

                  </div>
              `;
        });
      }

      // Wrap cards in container
      const cardContainer = document.createElement('div');

      cardContainer.className = 'item-card-container';

      cardContainer.innerHTML =
        cardsHtml || 'Tidak ada barang untuk kode ini.';

      cardContainer.style.display = 'grid';
      cardContainer.style.gridTemplateColumns =
        'repeat(auto-fill, minmax(280px, auto))';
      cardContainer.style.gap = '1rem';

      subPanel.appendChild(cardContainer);

      tabPanel.appendChild(subPanel);
    });

    barangKeluarTabContentContainer.appendChild(tabPanel);
  });

  // Set tanggal hari ini
  document.getElementById('barangKeluarTanggal').value =
    new Date().toISOString().split('T')[0];

  updateTotalHargaBarangKeluar();
} // tutup function populateBarangKeluarForm

function renderRiwayatBarangKeluar() {
  if (!tabelRiwayatBarangKeluar) return;

  const riwayat = dataBarangKeluar.slice().sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  if (riwayat.length === 0) {
    tabelRiwayatBarangKeluar.innerHTML = `<tr><td colspan="5" class="empty-table">Belum ada riwayat barang keluar.</td></tr>`;
  } else {
    // Gabungkan baris dengan nama barang yang sama
    const grouped = new Map();
    riwayat.forEach(record => {
      if (!grouped.has(record.namaBarang)) {
        grouped.set(record.namaBarang, { namaBarang: record.namaBarang, jumlah: 0, tanggal: [], keterangan: new Set() });
      }
      const g = grouped.get(record.namaBarang);
      g.jumlah += record.jumlah;
      g.tanggal.push(record.tanggal);
      if (record.keterangan) g.keterangan.add(record.keterangan);
    });

    let html = '';
    let index = 1;
    grouped.forEach(g => {
      const tglSorted = g.tanggal.slice().sort((a, b) => new Date(b) - new Date(a));
      const tglText = tglSorted.length === 1
        ? reverseDateFormat(tglSorted[0])
        : `${reverseDateFormat(tglSorted[tglSorted.length - 1])} – ${reverseDateFormat(tglSorted[0])}`;
      const ketText = g.keterangan.size > 0 ? Array.from(g.keterangan).join('; ') : '-';
      html += `
        <tr>
          <td style="text-align: center;">${index++}</td>
          <td>${tglText}</td>
          <td>${g.namaBarang}</td>
          <td class="text-right">${g.jumlah.toLocaleString('id-ID')}</td>
          <td>${ketText}</td>
        </tr>
      `;
    });
    tabelRiwayatBarangKeluar.innerHTML = html;
    feather.replace();
  }

  updateTotalPendapatanKeluar();
}

// Riwayat versi mobile (HP): tampilkan nama barang + jumlah saja
function renderRiwayatBarangKeluarHP() {
  const container = document.getElementById('hpHistoryBarangKeluar');
  if (!container) return;

  const riwayat = dataBarangKeluar.slice().sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  if (riwayat.length === 0) {
    container.innerHTML = `<div class="empty-table" style="padding: 20px 0;">Belum ada riwayat barang keluar.</div>`;
    return;
  }

  // Gabungkan berdasarkan nama barang (sama seperti di PC)
  const grouped = new Map();
  riwayat.forEach(record => {
    if (!grouped.has(record.namaBarang)) {
      grouped.set(record.namaBarang, { namaBarang: record.namaBarang, jumlah: 0, tanggal: [] });
    }
    const g = grouped.get(record.namaBarang);
    g.jumlah += record.jumlah;
    g.tanggal.push(record.tanggal);
  });

  let html = '';
  grouped.forEach(g => {
    const tglSorted = g.tanggal.slice().sort((a, b) => new Date(b) - new Date(a));
    const tglText = tglSorted.length === 1
      ? reverseDateFormat(tglSorted[0])
      : `${reverseDateFormat(tglSorted[tglSorted.length - 1])} – ${reverseDateFormat(tglSorted[0])}`;
    html += `
      <div class="hp-history-row">
        <span class="hp-history-info">
          <span class="hp-history-name">${g.namaBarang}</span>
          <span class="hp-history-date">${tglText}</span>
        </span>
        <span class="hp-history-qty">${g.jumlah.toLocaleString('id-ID')}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

if (formBarangKeluar) {
  formBarangKeluar.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedCards = barangKeluarTabContentContainer.querySelectorAll('.item-card-keluar.selected');
    const tanggal = document.getElementById('barangKeluarTanggal').value;
    const keteranganEl = document.getElementById('barangKeluarKeterangan');
    const keterangan = keteranganEl ? keteranganEl.value.trim() : '';

    if (selectedCards.length === 0) {
      return alert('Harap pilih minimal satu barang.');
    }

    const itemsToProcess = [];
    let validationFailed = false;

    // First loop: validate all selected items and prepare for deduction
    selectedCards.forEach(card => {
      if (validationFailed) return;

      const itemName = card.dataset.itemName;
      const qtyInput = card.querySelector('.item-qty-input');
      const requestedJumlah = parseInt(qtyInput.value);

      // Find all actual dataBarang items for this name that have stock
      const relevantDataBarangItems = dataBarang.filter(item => item.nama === itemName && item.datang > 0);
      const totalAvailableStock = relevantDataBarangItems.reduce((sum, item) => sum + item.datang, 0);

      if (isNaN(requestedJumlah) || requestedJumlah <= 0) {
        alert(`Jumlah keluar untuk barang "${itemName}" harus lebih dari 0.`);
        validationFailed = true;
        return;
      }
      if (requestedJumlah > totalAvailableStock) {
        alert(`Jumlah keluar untuk "${itemName}" (${requestedJumlah}) melebihi total stok tersedia (${totalAvailableStock}).`);
        validationFailed = true;
        return;
      }

      itemsToProcess.push({
        itemName: itemName,
        requestedJumlah: requestedJumlah,
        // Sort by stock descending to deduct from larger quantities first (or any other logic)
        relevantDataBarangItems: relevantDataBarangItems.sort((a, b) => b.datang - a.datang)
      });
    });

    if (validationFailed) {
      return; // Stop if any validation failed
    }

    // Second loop: process all validated items and deduct stock
    let totalTransactionsRecorded = 0;
    itemsToProcess.forEach(({ itemName, requestedJumlah, relevantDataBarangItems }) => {
      let remainingToDeduct = requestedJumlah;

      for (const item of relevantDataBarangItems) {
        if (remainingToDeduct <= 0) break; // All requested quantity has been deducted

        const deductedQty = Math.min(remainingToDeduct, item.datang);
        if (deductedQty > 0) {
          // The 'item' here is a reference to the object in dataBarang, so this modification is persistent.
          item.datang -= deductedQty; // Reduce stock from the specific dataBarang entry
          dataBarangKeluar.push({ // Record each individual deduction
            id: nextBarangKeluarId++,
            barangIdx: item._idx, // Store the original _idx for accurate reversal
            namaBarang: item.nama,
            jumlah: deductedQty,
            tanggal,
            keterangan
          });
          remainingToDeduct -= deductedQty;
          totalTransactionsRecorded++;
        }
      }
    });

    const uniqueItemsProcessed = itemsToProcess.length;
    alert(`${uniqueItemsProcessed} jenis barang dengan total ${totalTransactionsRecorded} transaksi keluar berhasil dicatat.`);
    formBarangKeluar.reset();
    populateBarangKeluarForm();
    renderRiwayatBarangKeluar();
    renderAll();
    saveAllData();
  });
}

// ================================================================
//  MODE HP (MOBILE) — sidebar PA / PI / STOK / RIWAYAT
// ================================================================
let hpCurrentSuffix = 'PA';

function initHpSidebar() {
  const sidebar = document.getElementById('hpSidebar');
  const overlay = document.getElementById('hpOverlay');
  const menuToggle = document.getElementById('hpMenuToggle');
  if (!sidebar || !menuToggle) return;

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  };

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  });

  if (overlay) overlay.addEventListener('click', closeSidebar);

  sidebar.addEventListener('click', (e) => {
    const item = e.target.closest('.hp-sidebar-item');
    if (!item) return;

    sidebar.querySelectorAll('.hp-sidebar-item').forEach(b => b.classList.remove('active'));
    item.classList.add('active');

    const view = item.dataset.view;
    const views = document.querySelectorAll('.hp-view');
    views.forEach(v => v.classList.remove('active'));

    const currentLabel = document.getElementById('hpCurrentCode');

    if (view === 'form') {
      hpCurrentSuffix = 'PA';
      document.getElementById('hp-view-form').classList.add('active');
      if (currentLabel) currentLabel.textContent = 'PA';
      populateBarangKeluarForm('PA');
    } else if (view === 'pi') {
      hpCurrentSuffix = 'PI';
      document.getElementById('hp-view-form').classList.add('active');
      if (currentLabel) currentLabel.textContent = 'PI';
      populateBarangKeluarForm('PI');
    } else if (view === 'stok') {
      document.getElementById('hp-view-stok').classList.add('active');
      renderStockListHP();
    } else if (view === 'riwayat') {
      document.getElementById('hp-view-riwayat').classList.add('active');
      renderRiwayatBarangKeluarHP();
    }

    closeSidebar();
    feather.replace();
  });
}

// Daftar stok barang (view STOK di HP)
function renderStockListHP() {
  const container = document.getElementById('hpStockList');
  if (!container) return;

  const searchEl = document.getElementById('searchHpStock');
  const term = searchEl ? searchEl.value.toLowerCase().trim() : '';

  if (dataBarang.length === 0) {
    container.innerHTML = `<div class="empty-table" style="padding: 20px 0;">Tidak ada data barang.</div>`;
    return;
  }

  const sorted = dataBarang.slice().sort((a, b) => a.nama.localeCompare(b.nama));
  let html = '';
  let visibleCount = 0;

  sorted.forEach(item => {
    const gudang = item.gudang || 'N/A';
    const haystack = `${item.nama} ${gudang} ${item.kode}`.toLowerCase();
    if (term && !haystack.includes(term)) return;
    visibleCount++;

    const badge = splitKode(item.kode).map(k => `<span class="badge">${k}</span>`).join(' ');
    html += `
      <div class="hp-stock-row">
        <div class="hp-stock-left">
          <span class="hp-stock-name">${item.nama}</span>
          <span class="hp-stock-kode">${badge}</span>
          <span class="hp-stock-gudang"><i data-feather="archive"></i> ${gudang}</span>
        </div>
        <span class="hp-stock-qty">${item.datang.toLocaleString('id-ID')}</span>
      </div>
    `;
  });

  if (visibleCount === 0) {
    container.innerHTML = `<div class="empty-table" style="padding: 20px 0;">Tidak ada barang yang cocok.</div>`;
  } else {
    container.innerHTML = html;
  }

  feather.replace();
}

// Pencarian stok di view STOK (HP)
(function setupStockSearchHP() {
  const searchEl = document.getElementById('searchHpStock');
  if (!searchEl) return;
  searchEl.addEventListener('input', renderStockListHP);
})();

function exportBarangKeluarCsv() {
  const headers = ['#', 'Tanggal', 'Nama Barang', 'Jumlah', 'Keterangan', 'Pendapatan'];
  const rows = dataBarangKeluar.slice().map((record, index) => {
    const item = dataBarang.find(i => i._idx === record.barangIdx);
    const hargaJual = item ? item.hargaJual : 0;
    return [
      index + 1,
      reverseDateFormat(record.tanggal),
      record.namaBarang,
      record.jumlah,
      record.keterangan || '-',
      hargaJual * record.jumlah
    ];
  });
  exportTableToCsv('barang_keluar.csv', headers, rows);
}

