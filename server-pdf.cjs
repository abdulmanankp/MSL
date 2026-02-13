const express = require('express');
const path = require('path');
const app = express();

// Serve PDFs from local uploads folder
app.use('/pdfs', express.static(path.join(__dirname, 'uploads')));

app.listen(4000, () => {
  console.log('PDF server running at http://localhost:4000/pdfs');
});
