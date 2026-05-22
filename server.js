// Server lokal untuk development
// Jalankan: node server.js

require('dotenv').config();
const app = require('./api/index');
const path = require('path');

// Serve static files (hanya untuk local dev)
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback (hanya untuk local dev)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Inisialisasi DB lalu start server
const { initDatabase } = require('./api/index');

if (require.main === module) {
  // initDatabase sudah dihandle oleh middleware di api/index.js
  app.listen(PORT, () => {
    console.log('========================================');
    console.log('  KasirKu Server berjalan di:');
    console.log('  http://localhost:' + PORT);
    console.log('========================================');
  });
}
