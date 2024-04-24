const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Enable Brotli compression
app.use(express.static(path.join(__dirname, 'public'), {
    brotli: true
}));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});