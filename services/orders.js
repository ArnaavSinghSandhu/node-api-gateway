const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ service: 'orders', path: req.path });
});

app.listen(4002, () => console.log('Users running'));