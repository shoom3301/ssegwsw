const express = require('express');
const app = express();

app.use('/example', express.static('.'));

app.listen(8081);

console.log('Listening on port 8081. http://localhost:8081/example/');
