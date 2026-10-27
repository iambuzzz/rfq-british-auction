const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const initSocket = require('./socket');
const rfqRoutes = require('./routes/rfqRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const PORT = process.env.PORT || 8000;
// can be more than one url, separated by comma
// eg. http://localhost:5173,https://rfq-auction.vercel.app
const CLIENT_URLS = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((url) => url.trim());

const app = express();
// socket.io needs the raw http server, not the express app
const server = http.createServer(app);
const io = initSocket(server, CLIENT_URLS);

// controllers can now get io using req.app.get('io')
app.set('io', io);

app.use(cors({ origin: CLIENT_URLS }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('RFQ British Auction API is running');
});

app.use('/api/rfqs', rfqRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
