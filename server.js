const express = require('express');
const dotenv = require('dotenv');
const sendRoute = require('./api/send.js');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/send', sendRoute);

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`📬 Server is running on http://localhost:${PORT}`);
});