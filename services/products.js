const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ service: 'products', path: req.path });
});

app.listen(4003, () => console.log('Users running'));