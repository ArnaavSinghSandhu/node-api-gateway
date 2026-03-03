const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ service: 'users', path: req.path });
});

app.listen(4001, () => console.log('Users running'));