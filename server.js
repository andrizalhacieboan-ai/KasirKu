require('dotenv').config();
const path = require('path');
const express = require('express');

const app = require('./api/index');

// Serve static files dari folder public (hanya local dev)
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  KasirKu Server berjalan di:');
  console.log('  http://localhost:' + PORT);
  console.log('========================================');
});
