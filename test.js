const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello from Express!'));
app.listen(4000, () => console.log('Test server running on port 4000'));