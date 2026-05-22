require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi Turso Database
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || ''
});

// Database initialization flag
let dbInitialized = false;

async function initDatabase() {
  if (dbInitialized) return;
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      key_password TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_area TEXT NOT NULL,
      keterangan TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      alamat TEXT DEFAULT '',
      telepon TEXT DEFAULT '',
      area_id INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      harga_beli REAL DEFAULT 0,
      harga_jual REAL DEFAULT 0,
      stok INTEGER DEFAULT 0,
      satuan TEXT DEFAULT 'pcs',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
      customer_id INTEGER DEFAULT 0,
      total REAL DEFAULT 0,
      bayar REAL DEFAULT 0,
      kembalian REAL DEFAULT 0,
      user_id INTEGER DEFAULT 0,
      status TEXT DEFAULT 'selesai'
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      qty INTEGER DEFAULT 0,
      harga REAL DEFAULT 0,
      subtotal REAL DEFAULT 0
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS sale_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
      total REAL DEFAULT 0,
      keterangan TEXT DEFAULT ''
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
      supplier TEXT DEFAULT '',
      total REAL DEFAULT 0,
      user_id INTEGER DEFAULT 0
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      qty INTEGER DEFAULT 0,
      harga REAL DEFAULT 0,
      subtotal REAL DEFAULT 0
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS purchase_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
      total REAL DEFAULT 0,
      keterangan TEXT DEFAULT ''
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS receivables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      customer_id INTEGER DEFAULT 0,
      jumlah REAL DEFAULT 0,
      dibayar REAL DEFAULT 0,
      sisa REAL DEFAULT 0,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS receivable_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receivable_id INTEGER NOT NULL,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
      jumlah REAL DEFAULT 0,
      keterangan TEXT DEFAULT ''
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS payables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      supplier TEXT DEFAULT '',
      jumlah REAL DEFAULT 0,
      dibayar REAL DEFAULT 0,
      sisa REAL DEFAULT 0,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS payable_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payable_id INTEGER NOT NULL,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
      jumlah REAL DEFAULT 0,
      keterangan TEXT DEFAULT ''
    )`);

    const existing = await db.execute("SELECT * FROM users WHERE username = 'andriyt'");
    if (existing.rows.length === 0) {
      await db.execute("INSERT INTO users (username, password, role, key_password) VALUES ('andriyt', 'andriyt002', 'admin', 'key002')");
    }
    dbInitialized = true;
    console.log('Database berhasil diinisialisasi');
  } catch (err) {
    console.error('Gagal inisialisasi database:', err.message);
  }
}

// Middleware: pastikan DB siap sebelum handle request
app.use(async (req, res, next) => {
  await initDatabase();
  next();
});

// ==================== API ROUTES ====================

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ? AND password = ?",
      args: [username, password]
    });
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.json({ success: false, message: 'Username atau password salah!' });
    }
  } catch (err) {
    res.json({ success: false, message: 'Server error: ' + err.message });
  }
});

// Ganti Password
app.post('/api/change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const check = await db.execute({
      sql: "SELECT * FROM users WHERE id = ? AND password = ?",
      args: [userId, oldPassword]
    });
    if (check.rows.length === 0) {
      return res.json({ success: false, message: 'Password lama salah!' });
    }
    await db.execute({
      sql: "UPDATE users SET password = ? WHERE id = ?",
      args: [newPassword, userId]
    });
    res.json({ success: true, message: 'Password berhasil diganti!' });
  } catch (err) {
    res.json({ success: false, message: 'Server error: ' + err.message });
  }
});

// Add Admin
app.post('/api/add-admin', async (req, res) => {
  try {
    const { username, password, keyPassword } = req.body;
    if (keyPassword !== 'key002') {
      return res.json({ success: false, message: 'Key password admin salah!' });
    }
    await db.execute({
      sql: "INSERT INTO users (username, password, role, key_password) VALUES (?, ?, 'admin', ?)",
      args: [username, password, keyPassword]
    });
    res.json({ success: true, message: 'Admin berhasil ditambahkan!' });
  } catch (err) {
    res.json({ success: false, message: 'Username mungkin sudah ada: ' + err.message });
  }
});

// Add User
app.post('/api/add-user', async (req, res) => {
  try {
    const { username, password, keyPassword } = req.body;
    if (keyPassword !== 'key002') {
      return res.json({ success: false, message: 'Key password salah!' });
    }
    await db.execute({
      sql: "INSERT INTO users (username, password, role, key_password) VALUES (?, ?, 'user', ?)",
      args: [username, password, keyPassword]
    });
    res.json({ success: true, message: 'User berhasil ditambahkan!' });
  } catch (err) {
    res.json({ success: false, message: 'Username mungkin sudah ada: ' + err.message });
  }
});

// ==================== AREA ====================
app.get('/api/areas', async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM areas ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/areas', async (req, res) => {
  try {
    const { nama_area, keterangan } = req.body;
    await db.execute({ sql: "INSERT INTO areas (nama_area, keterangan) VALUES (?, ?)", args: [nama_area, keterangan || ''] });
    res.json({ success: true, message: 'Area berhasil ditambahkan!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.delete('/api/areas/:id', async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM areas WHERE id = ?", args: [req.params.id] });
    res.json({ success: true, message: 'Area berhasil dihapus!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ==================== CUSTOMERS ====================
app.get('/api/customers', async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM customers ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/customers', async (req, res) => {
  try {
    const { nama, alamat, telepon, area_id } = req.body;
    await db.execute({ sql: "INSERT INTO customers (nama, alamat, telepon, area_id) VALUES (?, ?, ?, ?)", args: [nama, alamat || '', telepon || '', area_id || 0] });
    res.json({ success: true, message: 'Langganan berhasil ditambahkan!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.delete('/api/customers/:id', async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM customers WHERE id = ?", args: [req.params.id] });
    res.json({ success: true, message: 'Langganan berhasil dihapus!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ==================== PRODUCTS / STOK ====================
app.get('/api/products', async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM products ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/products', async (req, res) => {
  try {
    const { kode, nama, harga_beli, harga_jual, stok, satuan } = req.body;
    await db.execute({ sql: "INSERT INTO products (kode, nama, harga_beli, harga_jual, stok, satuan) VALUES (?, ?, ?, ?, ?, ?)", args: [kode, nama, harga_beli || 0, harga_jual || 0, stok || 0, satuan || 'pcs'] });
    res.json({ success: true, message: 'Produk berhasil ditambahkan!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.put('/api/products/:id', async (req, res) => {
  try {
    const { kode, nama, harga_beli, harga_jual, stok, satuan } = req.body;
    await db.execute({ sql: "UPDATE products SET kode=?, nama=?, harga_beli=?, harga_jual=?, stok=?, satuan=? WHERE id=?", args: [kode, nama, harga_beli, harga_jual, stok, satuan, req.params.id] });
    res.json({ success: true, message: 'Produk berhasil diupdate!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [req.params.id] });
    res.json({ success: true, message: 'Produk berhasil dihapus!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ==================== SALES ====================
app.get('/api/sales', async (req, res) => {
  try {
    const result = await db.execute("SELECT s.*, c.nama as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.tanggal >= datetime('now', '-30 days') ORDER BY s.id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/sales', async (req, res) => {
  try {
    const { customer_id, items, bayar } = req.body;
    let total = 0;
    items.forEach(item => { total += item.qty * item.harga; });
    const kembalian = bayar - total;
    const saleResult = await db.execute({
      sql: "INSERT INTO sales (customer_id, total, bayar, kembalian, user_id) VALUES (?, ?, ?, ?, 1)",
      args: [customer_id || 0, total, bayar || total, kembalian > 0 ? kembalian : 0]
    });
    const saleId = Number(saleResult.lastInsertRowid);
    for (const item of items) {
      await db.execute({
        sql: "INSERT INTO sale_items (sale_id, product_id, qty, harga, subtotal) VALUES (?, ?, ?, ?, ?)",
        args: [saleId, item.product_id, item.qty, item.harga, item.qty * item.harga]
      });
      await db.execute({ sql: "UPDATE products SET stok = stok - ? WHERE id = ?", args: [item.qty, item.product_id] });
    }
    res.json({ success: true, message: 'Transaksi penjualan berhasil!', saleId });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// Sale Returns
app.get('/api/sale-returns', async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM sale_returns ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/sale-returns', async (req, res) => {
  try {
    const { sale_id, total, keterangan } = req.body;
    await db.execute({ sql: "INSERT INTO sale_returns (sale_id, total, keterangan) VALUES (?, ?, ?)", args: [sale_id, total, keterangan || ''] });
    res.json({ success: true, message: 'Return penjualan berhasil dicatat!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ==================== PURCHASES ====================
app.get('/api/purchases', async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM purchases ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/purchases', async (req, res) => {
  try {
    const { supplier, items } = req.body;
    let total = 0;
    items.forEach(item => { total += item.qty * item.harga; });
    const purchaseResult = await db.execute({
      sql: "INSERT INTO purchases (supplier, total, user_id) VALUES (?, ?, 1)",
      args: [supplier || '', total]
    });
    const purchaseId = Number(purchaseResult.lastInsertRowid);
    for (const item of items) {
      await db.execute({
        sql: "INSERT INTO purchase_items (purchase_id, product_id, qty, harga, subtotal) VALUES (?, ?, ?, ?, ?)",
        args: [purchaseId, item.product_id, item.qty, item.harga, item.qty * item.harga]
      });
      await db.execute({ sql: "UPDATE products SET stok = stok + ? WHERE id = ?", args: [item.qty, item.product_id] });
    }
    res.json({ success: true, message: 'Transaksi pembelian berhasil!', purchaseId });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// Purchase Returns
app.get('/api/purchase-returns', async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM purchase_returns ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/purchase-returns', async (req, res) => {
  try {
    const { purchase_id, total, keterangan } = req.body;
    await db.execute({ sql: "INSERT INTO purchase_returns (purchase_id, total, keterangan) VALUES (?, ?, ?)", args: [purchase_id, total, keterangan || ''] });
    res.json({ success: true, message: 'Return pembelian berhasil dicatat!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ==================== RECEIVABLES ====================
app.get('/api/receivables', async (req, res) => {
  try {
    const result = await db.execute("SELECT r.*, c.nama as customer_name FROM receivables r LEFT JOIN customers c ON r.customer_id = c.id ORDER BY r.id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/receivable-payments', async (req, res) => {
  try {
    const { receivable_id, jumlah, keterangan } = req.body;
    await db.execute({ sql: "INSERT INTO receivable_payments (receivable_id, jumlah, keterangan) VALUES (?, ?, ?)", args: [receivable_id, jumlah, keterangan || ''] });
    await db.execute({ sql: "UPDATE receivables SET dibayar = dibayar + ?, sisa = sisa - ? WHERE id = ?", args: [jumlah, jumlah, receivable_id] });
    res.json({ success: true, message: 'Pembayaran piutang berhasil!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ==================== PAYABLES ====================
app.get('/api/payables', async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM payables ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/payable-payments', async (req, res) => {
  try {
    const { payable_id, jumlah, keterangan } = req.body;
    await db.execute({ sql: "INSERT INTO payable_payments (payable_id, jumlah, keterangan) VALUES (?, ?, ?)", args: [payable_id, jumlah, keterangan || ''] });
    await db.execute({ sql: "UPDATE payables SET dibayar = dibayar + ?, sisa = sisa - ? WHERE id = ?", args: [jumlah, jumlah, payable_id] });
    res.json({ success: true, message: 'Pembayaran hutang berhasil!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ==================== DATABASE MANAGEMENT ====================
app.post('/api/db/backup', async (req, res) => {
  try {
    const tables = ['users','areas','customers','products','sales','sale_items','sale_returns','purchases','purchase_items','purchase_returns','receivables','receivable_payments','payables','payable_payments'];
    const backup = {};
    for (const t of tables) {
      const r = await db.execute("SELECT * FROM " + t);
      backup[t] = r.rows;
    }
    res.json({ success: true, data: backup, timestamp: new Date().toISOString() });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/db/reset-opname', async (req, res) => {
  try {
    await db.execute("UPDATE products SET stok = 0");
    res.json({ success: true, message: 'Data opname berhasil direset!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
app.post('/api/db/tutup-buku', async (req, res) => {
  try {
    const { periode } = req.body;
    res.json({ success: true, message: 'Tutup buku periode ' + periode + ' berhasil!' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// Export untuk Vercel serverless function
module.exports = app;
