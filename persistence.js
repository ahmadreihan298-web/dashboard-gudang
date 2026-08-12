// ================================================================
//  PERSISTENSI — Google Sheets via Apps Script (+ fallback localStorage)
// ================================================================
const STORAGE_KEY = 'gdg_saved_data_v1';

// GANTI dengan URL hasil Deploy Apps Script kamu (akhiran /exec)
// Contoh: https://script.google.com/macros/s/AKfycb.../exec
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbw8WwiMIdqXPrCYbyS11fGea_HYLKMNbh33x-77vSH32Yrnni0JhPIsEptd6t9ouDgOiA/exec';

// Cadangan otomatis: kalau URL belum diisi, aplikasi tetap jalan di localStorage

function applySavedState(saved) {
  if (Array.isArray(saved.dataBarang)) dataBarang = saved.dataBarang;
  if (Array.isArray(saved.gudangList)) gudangList = saved.gudangList;
  if (Array.isArray(saved.dataBarangKeluar)) dataBarangKeluar = saved.dataBarangKeluar;
  if (typeof saved.nextBarangKeluarId === 'number') nextBarangKeluarId = saved.nextBarangKeluarId;
  if (typeof dataKeuangan !== 'undefined') {
    if (Array.isArray(saved.dataKeuangan)) dataKeuangan = saved.dataKeuangan;
    if (typeof saved.nextKeuanganId === 'number') nextKeuanganId = saved.nextKeuanganId;
  }
}

function buildState() {
  const state = {
    dataBarang: dataBarang,
    gudangList: gudangList,
    dataBarangKeluar: dataBarangKeluar,
    nextBarangKeluarId: nextBarangKeluarId
  };
  if (typeof dataKeuangan !== 'undefined') {
    state.dataKeuangan = dataKeuangan;
    state.nextKeuanganId = nextKeuanganId;
  }
  return state;
}

function loadFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    applySavedState(JSON.parse(raw));
  } catch (e) {
    console.error('Gagal memuat data tersimpan lokal:', e);
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildState()));
  } catch (e) {
    console.error('Gagal menyimpan data lokal:', e);
  }
}

async function loadAllData() {
  // Tampilkan cache lokal secepatnya; jangan menunggu jaringan.
  loadFromLocalStorage();

  try {
    const res = await fetch(SHEET_API_URL);
    const text = await res.text();
    if (!text) return; // Sel A1 masih kosong → pakai data default
    applySavedState(JSON.parse(text));
    saveToLocalStorage();
    if (typeof refreshAppViews === 'function') refreshAppViews();
  } catch (e) {
    console.warn('Google Sheets tidak tersedia, memakai cache lokal:', e);
  }
}

async function saveAllData() {
  saveToLocalStorage(); // Backup instan ke localStorage

  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      body: JSON.stringify(buildState())
    });
  } catch (e) {
    console.error('Gagal menyimpan ke Google Sheets (data aman di localStorage):', e);
  }
}
